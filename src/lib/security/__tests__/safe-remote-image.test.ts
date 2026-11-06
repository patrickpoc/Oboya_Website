import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import https from "node:https";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTransport,
  fetchRemoteImage,
  isPrivateAddress,
  sniffImageMime,
  type Transport,
  type TransportResponse,
} from "@/lib/security/safe-remote-image";

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const PUBLIC = [{ address: "93.184.216.34", family: 4 as const }];
const lookupPublic = async () => PUBLIC;

function response(init: {
  status?: number;
  headers?: Record<string, string>;
  chunks?: Uint8Array[];
}): TransportResponse {
  const chunks = init.chunks ?? [];
  return {
    status: init.status ?? 200,
    headers: init.headers ?? {},
    body: (async function* () {
      for (const chunk of chunks) yield chunk;
    })(),
    close: () => {},
  };
}

/** Records every connection the guard decides to make. */
function scripted(responses: TransportResponse[]) {
  const calls: Array<{ url: string; address: string }> = [];
  const transport: Transport = async ({ url, addresses }) => {
    calls.push({ url: url.toString(), address: addresses[0]!.address });
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");
    return next;
  };
  return { transport, calls };
}

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254",
    "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "198.18.0.1",
    "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1",
    "2002:7f00:1::1", "2001:db8::1", "64:ff9b::7f00:1", "not-an-ip",
  ])("blocks %s", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700:4700::1111"])("allows %s", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });
});

describe("fetchRemoteImage", () => {
  it("downloads a public https image and returns sniffed type", async () => {
    const { transport, calls } = scripted([
      response({ headers: { "content-type": "image/png" }, chunks: [PNG] }),
    ]);
    const result = await fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport });
    expect(result.mime).toBe("image/png");
    expect(result.buffer.equals(PNG)).toBe(true);
    // The connection is pinned to the validated address.
    expect(calls).toEqual([{ url: "https://cdn.example.com/a.png", address: "93.184.216.34" }]);
  });

  it.each([
    ["http://cdn.example.com/a.png", /https/],
    ["ftp://cdn.example.com/a.png", /https/],
    ["file:///etc/passwd", /https/],
    ["javascript:alert(1)", /https/],
    ["//cdn.example.com/a.png", /not valid/],
    ["https://user:pw@cdn.example.com/a.png", /credentials/],
    ["https://cdn.example.com:8443/a.png", /port/],
    ["https://localhost/a.png", /not allowed/],
    ["https://foo.localhost/a.png", /not allowed/],
    ["https://db.internal/a.png", /not allowed/],
    ["https://127.0.0.1/a.png", /not allowed/],
    ["https://[::1]/a.png", /not allowed/],
    ["https://169.254.169.254/latest/meta-data", /not allowed/],
    ["https://10.0.0.5/a.png", /not allowed/],
    ["https://2130706433/a.png", /not allowed/], // decimal 127.0.0.1
    ["https://0x7f.0.0.1/a.png", /not allowed/],
    ["https://[::ffff:7f00:1]/a.png", /not allowed/],
  ])("rejects %s before any connection", async (url, message) => {
    const { transport, calls } = scripted([]);
    await expect(fetchRemoteImage(url, { lookup: lookupPublic, transport })).rejects.toThrow(message);
    expect(calls).toHaveLength(0);
  });

  it("rejects a hostname that resolves to a private address, even mixed with a public one", async () => {
    const { transport, calls } = scripted([]);
    await expect(
      fetchRemoteImage("https://rebind.example.com/a.png", {
        lookup: async () => [
          { address: "93.184.216.34", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ],
        transport,
      })
    ).rejects.toThrow(/not allowed/);
    expect(calls).toHaveLength(0);
  });

  it("rejects a redirect to a private IP literal and never connects to it", async () => {
    const { transport, calls } = scripted([
      response({ status: 302, headers: { location: "https://169.254.169.254/latest/meta-data/" } }),
    ]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/not allowed/);
    expect(calls).toHaveLength(1);
  });

  it("rejects a redirect to a hostname that resolves to a private address", async () => {
    const { transport, calls } = scripted([
      response({ status: 301, headers: { location: "https://internal.example.com/x.png" } }),
    ]);
    const lookup = async (host: string) =>
      host === "internal.example.com" ? [{ address: "10.0.0.8", family: 4 as const }] : PUBLIC;
    await expect(fetchRemoteImage("https://cdn.example.com/a.png", { lookup, transport })).rejects.toThrow(
      /not allowed/
    );
    expect(calls).toHaveLength(1);
  });

  it("rejects a redirect downgrade to http", async () => {
    const { transport } = scripted([
      response({ status: 302, headers: { location: "http://cdn.example.com/a.png" } }),
    ]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/https/);
  });

  it("follows a safe redirect (relative Location) and re-resolves each hop", async () => {
    const { transport, calls } = scripted([
      response({ status: 302, headers: { location: "/b.png" } }),
      response({ headers: { "content-type": "image/png" }, chunks: [PNG] }),
    ]);
    const result = await fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport });
    expect(result.finalUrl).toBe("https://cdn.example.com/b.png");
    expect(calls.map((c) => c.url)).toEqual(["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"]);
  });

  it("stops after too many redirects", async () => {
    const hop = () => response({ status: 302, headers: { location: "https://cdn.example.com/next" } });
    const { transport } = scripted([hop(), hop(), hop(), hop(), hop()]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/redirects/);
  });

  it("rejects a redirect without Location", async () => {
    const { transport } = scripted([response({ status: 302 })]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/redirect/);
  });

  it.each(["text/html", "image/svg+xml", "application/octet-stream", ""])(
    "rejects content type %j",
    async (type) => {
      const { transport } = scripted([response({ headers: { "content-type": type }, chunks: [PNG] })]);
      await expect(
        fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
      ).rejects.toThrow(/JPEG, PNG or WebP/);
    }
  );

  it("rejects an HTML body labeled as image/png (content sniffing)", async () => {
    const { transport } = scripted([
      response({ headers: { "content-type": "image/png" }, chunks: [Buffer.from("<html><script>alert(1)</script></html>")] }),
    ]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/not the image type/);
  });

  it("rejects when the reported type and the real type differ", async () => {
    const { transport } = scripted([response({ headers: { "content-type": "image/jpeg" }, chunks: [PNG] })]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/not the image type/);
  });

  it("rejects an oversize body announced by Content-Length without reading it", async () => {
    const res = response({ headers: { "content-type": "image/png", "content-length": "999999999" }, chunks: [PNG] });
    const { transport } = scripted([res]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport, maxBytes: 1024 })
    ).rejects.toThrow(/larger than/);
  });

  it("rejects an oversize body that lies about (or omits) Content-Length", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(4096)]);
    const { transport } = scripted([
      response({ headers: { "content-type": "image/png", "content-length": "10" }, chunks: [big.subarray(0, 2048), big.subarray(2048)] }),
    ]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport, maxBytes: 2000 })
    ).rejects.toThrow(/larger than/);
  });

  it("rejects non-200 statuses and compressed responses", async () => {
    const a = scripted([response({ status: 404 })]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport: a.transport })
    ).rejects.toThrow(/HTTP 404/);
    const b = scripted([response({ headers: { "content-type": "image/png", "content-encoding": "gzip" }, chunks: [PNG] })]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport: b.transport })
    ).rejects.toThrow(/Compressed/);
  });

  it("reports an unresolvable host", async () => {
    const { transport } = scripted([]);
    await expect(
      fetchRemoteImage("https://nope.example.com/a.png", {
        lookup: async () => {
          throw new Error("ENOTFOUND");
        },
        transport,
      })
    ).rejects.toThrow(/could not be resolved/);
  });

  it("uses real DNS for localhost and refuses it (no transport injected)", async () => {
    await expect(fetchRemoteImage("https://localhost/a.png")).rejects.toThrow(/not allowed/);
  });
});

describe("fetchRemoteImage limits", () => {
  it("applies one deadline to a slow DNS lookup", async () => {
    const { transport, calls } = scripted([]);
    await expect(
      fetchRemoteImage("https://slow.example.com/a.png", {
        lookup: () => new Promise(() => {}),
        transport,
        timeoutMs: 30,
      })
    ).rejects.toThrow(/timed out/);
    expect(calls).toHaveLength(0);
  });

  it("shares the deadline across redirect hops", async () => {
    const signals: AbortSignal[] = [];
    let n = 0;
    const transport: Transport = async ({ signal }) => {
      signals.push(signal);
      await new Promise((r) => setTimeout(r, 25));
      n += 1;
      return response({ status: 302, headers: { location: `https://cdn.example.com/${n}` } });
    };
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.png", { lookup: lookupPublic, transport, timeoutMs: 60 })
    ).rejects.toThrow(/timed out/);
    expect(new Set(signals).size).toBe(1);
  });

  it("passes every validated record to the transport", async () => {
    const seen: string[][] = [];
    const transport: Transport = async ({ addresses }) => {
      seen.push(addresses.map((a) => a.address));
      return response({ headers: { "content-type": "image/png" }, chunks: [PNG] });
    };
    await fetchRemoteImage("https://dual.example.com/a.png", {
      lookup: async () => [
        { address: "2606:4700:4700::1111", family: 6 },
        { address: "93.184.216.34", family: 4 },
      ],
      transport,
    });
    expect(seen).toEqual([["2606:4700:4700::1111", "93.184.216.34"]]);
  });

  it("accepts a public bracketed IPv6 literal and refuses a private one", async () => {
    const ok = scripted([response({ headers: { "content-type": "image/png" }, chunks: [PNG] })]);
    await fetchRemoteImage("https://[2606:4700:4700::1111]/a.png", { transport: ok.transport });
    expect(ok.calls[0]!.address).toBe("2606:4700:4700::1111");
    await expect(fetchRemoteImage("https://[fd00::1]/a.png", { transport: ok.transport })).rejects.toThrow(
      /not allowed/
    );
  });

  it("refuses GIF", async () => {
    const { transport } = scripted([
      response({ headers: { "content-type": "image/gif" }, chunks: [Buffer.from("GIF89a")] }),
    ]);
    await expect(
      fetchRemoteImage("https://cdn.example.com/a.gif", { lookup: lookupPublic, transport })
    ).rejects.toThrow(/JPEG, PNG or WebP/);
  });
});

// Real TLS server on loopback. The key and certificate are generated into a temp dir at run
// time (nothing committed); the suite is skipped where the openssl CLI is missing.
function hasOpenssl() {
  try {
    execFileSync("openssl", ["version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!hasOpenssl())("fetchRemoteImage over a real TLS server", () => {
  let dir = "";
  let server: https.Server;
  let port = 0;
  let cert = "";
  const lookup = async () => [{ address: "127.0.0.1", family: 4 as const }];
  const allowLoopback = (address: string) => address === "127.0.0.1";

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "oboya-tls-"));
    execFileSync(
      "openssl",
      [
        "req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes",
        "-keyout", path.join(dir, "k.pem"), "-out", path.join(dir, "c.pem"), "-days", "1",
        "-subj", "/CN=img.test", "-addext", "subjectAltName=DNS:img.test",
      ],
      { stdio: "ignore" }
    );
    cert = readFileSync(path.join(dir, "c.pem"), "utf8");
    server = https.createServer(
      { key: readFileSync(path.join(dir, "k.pem")), cert },
      (req, res) => {
        if (req.url === "/ok.png") {
          res.writeHead(200, { "content-type": "image/png" });
          res.end(PNG);
        } else if (req.url === "/hang.png") {
          res.writeHead(200, { "content-type": "image/png" });
          res.write(PNG.subarray(0, 8)); // never finishes
        } else {
          res.writeHead(404).end();
        }
      }
    );
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    server?.closeAllConnections();
    await new Promise((resolve) => server?.close(resolve));
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  const run = (file: string, over: Parameters<typeof fetchRemoteImage>[1] = {}) =>
    fetchRemoteImage(`https://img.test/${file}`, {
      lookup,
      allowAddress: allowLoopback,
      transport: createTransport({ port, ca: cert }),
      ...over,
    });

  it("downloads through the pinned address with SNI and verification on", async () => {
    const result = await run("ok.png");
    expect(result.mime).toBe("image/png");
    expect(result.buffer.equals(PNG)).toBe(true);
  });

  it("refuses the loopback address without the allowance", async () => {
    await expect(run("ok.png", { allowAddress: undefined })).rejects.toThrow(/not allowed/);
  });

  it("rejects a certificate the trust store does not know", async () => {
    await expect(run("ok.png", { transport: createTransport({ port }) })).rejects.toThrow(/Could not reach/);
  });

  it("aborts a body that stalls after the headers", async () => {
    await expect(run("hang.png", { timeoutMs: 300 })).rejects.toThrow(/timed out|interrupted/);
  });
});

describe("sniffImageMime", () => {
  it("recognizes JPEG, PNG and WebP and nothing else (GIF is refused)", () => {
    expect(sniffImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageMime(PNG)).toBe("image/png");
    expect(sniffImageMime(Buffer.from("GIF89a"))).toBeNull();
    expect(sniffImageMime(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageMime(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
  });
});
