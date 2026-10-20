import { describe, expect, it } from "vitest";
import { isExpiredPending, isRetentionExpired } from "../retention";
import { toAdminApplication } from "../admin-view";
import { headMatchesMime } from "../cv-signature";
import type { JobApplication } from "../types";

const NOW = Date.parse("2026-10-20T00:00:00Z");
const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString();
const app = (o: Partial<JobApplication>) => ({ source: "website", extra: {}, createdAt: ago(0), ...o }) as JobApplication;

describe("purge selection", () => {
  it("deletes only website rows pending for more than 24 h", () => {
    expect(isExpiredPending(app({ extra: { cvPending: true }, createdAt: ago(2) }), NOW)).toBe(true);
    expect(isExpiredPending(app({ extra: { cvPending: true }, createdAt: ago(0.5) }), NOW)).toBe(false);
    expect(isExpiredPending(app({ createdAt: ago(5) }), NOW)).toBe(false);
    expect(isExpiredPending(app({ extra: { cvPending: true }, cvPath: "applications/x/cv.pdf", createdAt: ago(5) }), NOW)).toBe(false);
    expect(isExpiredPending(app({ source: "manual", extra: { cvPending: true }, createdAt: ago(5) }), NOW)).toBe(false);
  });

  it("anonymizes after 12 months, 24 with talent pool consent, skipping anonymized rows", () => {
    expect(isRetentionExpired(app({ createdAt: ago(366) }), NOW)).toBe(true);
    expect(isRetentionExpired(app({ createdAt: ago(300) }), NOW)).toBe(false);
    expect(isRetentionExpired(app({ createdAt: ago(400), consentTalentPool: true }), NOW)).toBe(false);
    expect(isRetentionExpired(app({ createdAt: ago(731), consentTalentPool: true }), NOW)).toBe(true);
    expect(isRetentionExpired(app({ createdAt: ago(900), anonymizedAt: ago(1) }), NOW)).toBe(false);
  });
});

describe("toAdminApplication", () => {
  it("strips meta and ticket/pending keys but keeps duplicateOf", () => {
    const out = toAdminApplication(
      app({ extra: { meta: { ipHash: "h" }, cvPending: true, cvPendingPath: "p", cvTicketHash: "t", cvTicketExp: 1, cvName: "n", duplicateOf: "d" } })
    );
    expect(out.extra).toEqual({ cvName: "n", duplicateOf: "d" });
  });
});

/** Builds consecutive local headers; `size` 0 mimics a data-descriptor entry followed by 6 data bytes. */
function zipEntries(entries: Array<{ name: string; size: number }>) {
  const parts: number[] = [];
  for (const { name, size } of entries) {
    const nameBytes = [...new TextEncoder().encode(name)];
    const header = new Uint8Array(30);
    const v = new DataView(header.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint32(18, size, true);
    v.setUint16(26, nameBytes.length, true);
    parts.push(...header, ...nameBytes, ...new Array(size || 6).fill(7));
  }
  return new Uint8Array(parts);
}

function zipHead(name: string) {
  const nameBytes = new TextEncoder().encode(name);
  const buf = new Uint8Array(30 + nameBytes.length + 10);
  const v = new DataView(buf.buffer);
  v.setUint32(0, 0x04034b50, true);
  v.setUint32(18, 10, true);
  v.setUint16(26, nameBytes.length, true);
  buf.set(nameBytes, 30);
  return buf;
}
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("headMatchesMime", () => {
  it("accepts docx with [Content_Types].xml or word/ entry", () => {
    expect(headMatchesMime(zipHead("[Content_Types].xml"), DOCX)).toBe(true);
    expect(headMatchesMime(zipHead("word/document.xml"), DOCX)).toBe(true);
  });
  it("accepts when word/ comes after other entries, including data-descriptor entries", () => {
    const head = zipEntries([
      { name: "docProps/app.xml", size: 0 },
      { name: "customXml/item1.xml", size: 0 },
      { name: "word/document.xml", size: 20 },
    ]);
    expect(headMatchesMime(head, DOCX)).toBe(true);
  });
  it("accepts a zip with _rels/ or docProps/ entries and no word/ in the first 4 KB", () => {
    expect(headMatchesMime(zipEntries([{ name: "_rels/.rels", size: 20 }]), DOCX)).toBe(true);
    expect(headMatchesMime(zipEntries([{ name: "docProps/core.xml", size: 0 }]), DOCX)).toBe(true);
  });
  it("rejects a generic zip as docx", () => {
    expect(headMatchesMime(zipHead("evil.exe"), DOCX)).toBe(false);
  });
  it("checks pdf magic bytes", () => {
    expect(headMatchesMime(new TextEncoder().encode("%PDF-1.7"), "application/pdf")).toBe(true);
    expect(headMatchesMime(new TextEncoder().encode("MZ......"), "application/pdf")).toBe(false);
  });
});
