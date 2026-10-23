/** Guards for anonymous JSON POST endpoints. */

/** Browsers always send Origin on cross-site and same-site POSTs; require it to match the host. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type BoundedJson = { ok: true; body: unknown } | { ok: false; status: 400 | 413 };

/** Streams the body counting bytes, aborts with 413 once past `maxBytes`, then parses JSON (400 on failure). */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<BoundedJson> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  try {
    return { ok: true, body: JSON.parse(Buffer.concat(chunks).toString("utf-8")) };
  } catch {
    return { ok: false, status: 400 };
  }
}
