import { createHash, createHmac } from "node:crypto";

/**
 * Trusts platform headers: on Vercel `x-vercel-forwarded-for` is set by the edge and cannot be spoofed by the
 * client, so it wins. `x-real-ip` comes next, then the first `x-forwarded-for` hop (client-controllable off-platform).
 */
export function clientIpFromRequest(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** HMAC-SHA256 of the IP with a server-only secret. Throws in production when the secret is missing (fail closed). */
export function hashClientIpKeyed(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("IP_HASH_SECRET missing");
  return createHmac("sha256", secret || "dev-only-ip-hash-secret").update(ip).digest("hex").slice(0, 32);
}
