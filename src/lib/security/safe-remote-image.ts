import { BlockList, isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";
import https from "node:https";

/**
 * SSRF-safe download of an admin-supplied image URL.
 *
 * Rules: https only, port 443, no credentials, every resolved address must be
 * public, the connection is pinned to the validated address (no DNS rebinding
 * between check and connect), redirects are followed manually (max 3) and
 * re-validated per hop, response must be an allowed image type under the size
 * cap, with an identity-encoded body and a deadline.
 */

export const REMOTE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const REMOTE_IMAGE_MAX_REDIRECTS = 3;
export const REMOTE_IMAGE_TIMEOUT_MS = 15_000;
export const REMOTE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export class RemoteImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RemoteImageError";
  }
}

const blockedV4 = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedV4.addSubnet(net, prefix, "ipv4");
}

/** IPv6: only global unicast (2000::/3) is allowed, minus special-purpose ranges inside it. */
const allowedV6 = new BlockList();
allowedV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [net, prefix] of [
  ["2001::", 23], // IETF protocol assignments, Teredo
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (embeds an IPv4 address)
  ["3fff::", 20], // documentation
] as const) {
  blockedV6.addSubnet(net, prefix, "ipv6");
}

/** True when the literal is not a public, routable unicast address. */
export function isPrivateAddress(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) return blockedV4.check(address, "ipv4");
  if (kind === 6) {
    // ::ffff:a.b.c.d and other non-2000::/3 forms (loopback, ULA, link-local, mapped) are refused.
    return !allowedV6.check(address, "ipv6") || blockedV6.check(address, "ipv6");
  }
  return true;
}

export type ResolvedAddress = { address: string; family: 4 | 6 };
export type LookupAll = (hostname: string) => Promise<ResolvedAddress[]>;

export type TransportResponse = {
  status: number;
  headers: Record<string, string | undefined>;
  body: AsyncIterable<Uint8Array>;
  close: () => void;
};
export type Transport = (request: {
  url: URL;
  /** Validated addresses; the connection may only use these. */
  addresses: ResolvedAddress[];
  /** Fires when the whole fetch (DNS, every hop, headers, body) runs out of time. */
  signal: AbortSignal;
}) => Promise<TransportResponse>;

export type RemoteImageDeps = {
  lookup?: LookupAll;
  transport?: Transport;
  /** Test seam: addresses for which the private-range refusal is waived. */
  allowAddress?: (address: string) => boolean;
  maxBytes?: number;
  maxRedirects?: number;
  timeoutMs?: number;
};

export type RemoteImage = { buffer: Buffer; mime: string; finalUrl: string };

const timeoutError = () => new RemoteImageError("The image download timed out.");

const stripBrackets = (host: string) => host.replace(/^\[|\]$/g, "");

const defaultLookup: LookupAll = async (hostname) => {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map((r) => ({ address: r.address, family: r.family === 6 ? 6 : 4 }));
};

/** Rejects with the timeout error when `signal` fires before `promise` settles. */
function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) return reject(timeoutError());
    const onAbort = () => reject(timeoutError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/**
 * Connects to the already-validated addresses only; Host/SNI stay the original hostname.
 * `port` / `ca` exist for tests that talk to a local TLS server; production uses the defaults
 * (443, system trust store, certificate verification always on).
 */
export function createTransport(options: { port?: number; ca?: string | Buffer } = {}): Transport {
  return ({ url, addresses, signal }) =>
    new Promise((resolve, reject) => {
      const host = stripBrackets(url.hostname);
      const req = https.request(
        {
          protocol: "https:",
          hostname: host,
          port: options.port ?? 443,
          path: `${url.pathname}${url.search}`,
          method: "GET",
          agent: false,
          rejectUnauthorized: true,
          ca: options.ca,
          signal,
          servername: isIP(host) ? undefined : host,
          headers: {
            Host: url.host,
            Accept: REMOTE_IMAGE_TYPES.join(", "),
            "Accept-Encoding": "identity",
            "User-Agent": "OboyaCMS-ImageImport/1.0",
          },
          // All validated records are offered so a host without IPv6 egress can fall back to IPv4.
          lookup: (_host, opts, cb) => {
            if ((opts as { all?: boolean })?.all) {
              (cb as unknown as (e: null, a: unknown[]) => void)(
                null,
                addresses.map((a) => ({ address: a.address, family: a.family }))
              );
            } else {
              cb(null, addresses[0]!.address, addresses[0]!.family);
            }
          },
        },
        (res) => {
          const headers: Record<string, string | undefined> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            headers[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
          }
          resolve({
            status: res.statusCode ?? 0,
            headers,
            body: res,
            close: () => res.destroy(),
          });
        }
      );
      req.on("error", (error) =>
        reject(
          error instanceof RemoteImageError
            ? error
            : signal.aborted
              ? timeoutError()
              : new RemoteImageError("Could not reach the image host.")
        )
      );
      req.end();
    });
}

const defaultTransport = createTransport();

const privateCheck = (allow?: (address: string) => boolean) => (address: string) =>
  !allow?.(address) && isPrivateAddress(address);

function parseSafeUrl(raw: string, isPrivate: (address: string) => boolean, base?: URL): URL {
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    throw new RemoteImageError("The image URL is not valid.");
  }
  if (url.protocol !== "https:") throw new RemoteImageError("Only https:// image URLs can be imported.");
  if (url.username || url.password) throw new RemoteImageError("Image URLs with credentials are not allowed.");
  if (url.port && url.port !== "443") throw new RemoteImageError("Only the default https port is allowed.");
  const host = stripBrackets(url.hostname).toLowerCase();
  if (!host) throw new RemoteImageError("The image URL is not valid.");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new RemoteImageError("The image host is not allowed.");
  }
  if (isIP(host) && isPrivate(host)) throw new RemoteImageError("The image host is not allowed.");
  return url;
}

async function resolvePublicAddresses(
  url: URL,
  lookup: LookupAll,
  isPrivate: (address: string) => boolean,
  signal: AbortSignal
): Promise<ResolvedAddress[]> {
  const host = stripBrackets(url.hostname);
  const kind = isIP(host);
  if (kind) return [{ address: host, family: kind === 6 ? 6 : 4 }];
  let records: ResolvedAddress[];
  try {
    records = await raceAbort(lookup(host), signal);
  } catch (error) {
    if (error instanceof RemoteImageError) throw error;
    throw new RemoteImageError("The image host could not be resolved.");
  }
  if (records.length === 0) throw new RemoteImageError("The image host could not be resolved.");
  // One private record is enough to refuse: a mixed answer is a rebinding signal.
  if (records.some((r) => isPrivate(r.address))) {
    throw new RemoteImageError("The image host is not allowed.");
  }
  return records;
}

/** Content sniffing so a mislabeled body (HTML, SVG, scripts) is refused. */
export function sniffImageMime(buf: Uint8Array): (typeof REMOTE_IMAGE_TYPES)[number] | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function fetchRemoteImage(rawUrl: string, deps: RemoteImageDeps = {}): Promise<RemoteImage> {
  const lookup = deps.lookup ?? defaultLookup;
  const transport = deps.transport ?? defaultTransport;
  const maxBytes = deps.maxBytes ?? REMOTE_IMAGE_MAX_BYTES;
  const maxRedirects = deps.maxRedirects ?? REMOTE_IMAGE_MAX_REDIRECTS;
  const isPrivate = privateCheck(deps.allowAddress);

  // One budget for the whole call: DNS, connect, headers, body and every redirect hop.
  const signal = AbortSignal.timeout(deps.timeoutMs ?? REMOTE_IMAGE_TIMEOUT_MS);

  let url = parseSafeUrl(rawUrl.trim(), isPrivate);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const addresses = await resolvePublicAddresses(url, lookup, isPrivate, signal);
    const response = await raceAbort(transport({ url, addresses, signal }), signal);
    try {
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.location;
        if (!location) throw new RemoteImageError("The image host sent an invalid redirect.");
        if (hop === maxRedirects) throw new RemoteImageError("Too many redirects.");
        url = parseSafeUrl(location, isPrivate, url);
        continue;
      }
      if (response.status !== 200) {
        throw new RemoteImageError(`The image host answered HTTP ${response.status}.`);
      }
      const encoding = (response.headers["content-encoding"] ?? "identity").toLowerCase();
      if (encoding !== "identity") throw new RemoteImageError("Compressed image responses are not accepted.");
      const declared = (response.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
      if (!(REMOTE_IMAGE_TYPES as readonly string[]).includes(declared)) {
        throw new RemoteImageError("The URL does not point to a JPEG, PNG or WebP image.");
      }
      const length = Number(response.headers["content-length"]);
      if (Number.isFinite(length) && length > maxBytes) {
        throw new RemoteImageError(`The image is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
      }

      const chunks: Uint8Array[] = [];
      let total = 0;
      // Injected transports may not honour the signal, so also close the body when it fires.
      const onAbort = () => response.close();
      signal.addEventListener("abort", onAbort, { once: true });
      try {
        for await (const chunk of response.body) {
          total += chunk.byteLength;
          if (total > maxBytes) {
            throw new RemoteImageError(`The image is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
          }
          chunks.push(chunk);
        }
      } catch (error) {
        if (error instanceof RemoteImageError) throw error;
        throw new RemoteImageError("The image download was interrupted or timed out.");
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
      if (signal.aborted) throw timeoutError();

      const buffer = Buffer.concat(chunks);
      const sniffed = sniffImageMime(buffer);
      if (!sniffed || sniffed !== declared) {
        throw new RemoteImageError("The downloaded file is not the image type the host reported.");
      }
      return { buffer, mime: sniffed, finalUrl: url.toString() };
    } finally {
      response.close();
    }
  }
  throw new RemoteImageError("Too many redirects.");
}
