import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

vi.mock("server-only", () => ({}));

const getApplication = vi.fn();
const attachPublicCv = vi.fn();
const patchApplicationExtra = vi.fn();
const consumeCvTicket = vi.fn();
const findRecentDuplicate = vi.fn();
const insertPublicApplication = vi.fn();
const createCvUploadUrl = vi.fn();
const verifyCvObject = vi.fn();
const isOpeningIdPublicLive = vi.fn();
vi.mock("@/lib/cms/server/careers-applications.server", () => ({
  getApplication,
  attachPublicCv,
  patchApplicationExtra,
  consumeCvTicket,
  findRecentDuplicate,
  insertPublicApplication,
}));
vi.mock("@/lib/cms/server/careers-cv.server", () => ({ verifyCvObject, createCvUploadUrl }));
vi.mock("@/lib/cms/server/careers-public.server", () => ({ isOpeningIdPublicLive }));

const ID = "11111111-1111-4111-8111-111111111111";
const PATH = `applications/${ID}/cv-22222222-2222-4222-8222-222222222222.pdf`;
const TICKET = "t".repeat(43);
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

function row(extra: Record<string, unknown> = {}) {
  return {
    id: ID,
    source: "website",
    openingId: null,
    extra: {
      cvPending: true,
      cvPendingPath: PATH,
      cvTicketHash: hash(TICKET),
      cvTicketExp: Date.now() + 60_000,
      cvName: "cv.pdf",
      meta: { ipHash: "x" },
      ...extra,
    },
  };
}

async function confirm(input: Partial<{ applicationId: string; path: string; ticket: string }> = {}) {
  const { confirmPublicCv } = await import("@/lib/cms/server/careers-public-apply.server");
  return confirmPublicCv({ applicationId: ID, path: PATH, ticket: TICKET, ...input });
}

beforeEach(() => {
  vi.clearAllMocks();
  getApplication.mockResolvedValue(row());
  verifyCvObject.mockResolvedValue({ size: 10, mime: "application/pdf" });
  isOpeningIdPublicLive.mockResolvedValue(true);
  consumeCvTicket.mockResolvedValue(true);
  patchApplicationExtra.mockResolvedValue(true);
  findRecentDuplicate.mockResolvedValue(null);
  createCvUploadUrl.mockResolvedValue({ path: PATH, signedUrl: "u" });
});

describe("confirmPublicCv", () => {
  it("attaches the CV and clears the ticket", async () => {
    await confirm();
    expect(attachPublicCv).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ path: PATH, filename: "cv.pdf" }),
      { meta: { ipHash: "x" } }
    );
    expect(patchApplicationExtra).not.toHaveBeenCalled();
  });

  it("rejects a wrong ticket", async () => {
    await expect(confirm({ ticket: "x".repeat(43) })).rejects.toMatchObject({ code: "invalidTicket" });
    expect(attachPublicCv).not.toHaveBeenCalled();
  });

  it("rejects an expired ticket", async () => {
    getApplication.mockResolvedValue(row({ cvTicketExp: Date.now() - 1 }));
    await expect(confirm()).rejects.toMatchObject({ code: "invalidTicket" });
  });

  it("rejects a reused ticket (hash already cleared)", async () => {
    getApplication.mockResolvedValue({ ...row(), extra: { meta: {} } });
    await expect(confirm()).rejects.toMatchObject({ code: "invalidTicket" });
  });

  it("rejects an unknown application the same way", async () => {
    getApplication.mockResolvedValue(null);
    await expect(confirm()).rejects.toMatchObject({ code: "invalidTicket" });
  });

  it("rejects a path other than the issued one", async () => {
    const other = `applications/${ID}/cv-33333333-3333-4333-8333-333333333333.pdf`;
    await expect(confirm({ path: other })).rejects.toMatchObject({ code: "invalidTicket" });
    expect(verifyCvObject).not.toHaveBeenCalled();
  });

  it("refuses when the opening is no longer public", async () => {
    getApplication.mockResolvedValue({ ...row(), openingId: "o1" });
    isOpeningIdPublicLive.mockResolvedValue(false);
    await expect(confirm()).rejects.toMatchObject({ code: "openingClosed" });
    expect(attachPublicCv).not.toHaveBeenCalled();
  });

  it("does not save CV metadata when verification fails, and restores the pending state", async () => {
    verifyCvObject.mockRejectedValue(new Error("invalidType"));
    await expect(confirm()).rejects.toThrow();
    expect(attachPublicCv).not.toHaveBeenCalled();
    expect(patchApplicationExtra).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ cvPending: true, cvTicketHash: hash(TICKET) }),
      { ifNoTicket: true }
    );
  });

  it("consumes the ticket atomically before verifying; a lost race fails without side effects", async () => {
    consumeCvTicket.mockResolvedValue(false);
    await expect(confirm()).rejects.toMatchObject({ code: "invalidTicket" });
    expect(consumeCvTicket).toHaveBeenCalledWith(ID, hash(TICKET), expect.not.objectContaining({ cvTicketHash: expect.anything() }));
    expect(verifyCvObject).not.toHaveBeenCalled();
    expect(attachPublicCv).not.toHaveBeenCalled();
  });
});

describe("createPublicApplication duplicates", () => {
  const parsed = {
    application: { email: "a@x.com" },
    cv: { name: "cv.pdf", mime: "application/pdf", size: 10 },
    locale: "en",
  } as never;
  async function create() {
    const { createPublicApplication } = await import("@/lib/cms/server/careers-public-apply.server");
    return createPublicApplication(parsed, { openingId: null, ipHash: "h" });
  }

  it("flags a recent duplicate but still creates the row and returns a ticket", async () => {
    findRecentDuplicate.mockResolvedValue("old-id");
    const out = await create();
    expect(out.ticket).toBeTruthy();
    expect(insertPublicApplication.mock.calls[0][0].extra).toMatchObject({ duplicateOf: "old-id", cvPending: true });
  });

  it("does not set duplicateOf when there is none", async () => {
    await create();
    expect(insertPublicApplication.mock.calls[0][0].extra).not.toHaveProperty("duplicateOf");
  });
});

describe("assertCareersApplyRateLimit", () => {
  async function run(counts: { global?: number; email?: number; ip?: number; error?: boolean }) {
    vi.resetModules();
    const eqCalls: string[] = [];
    vi.doMock("@/lib/supabase/admin", () => ({
      createServiceClient: () => ({
        from: () => {
          const calls: string[] = [];
          const q: Record<string, unknown> = {};
          q.select = () => q;
          q.gte = () => q;
          q.eq = (col: string) => {
            calls.push(col);
            eqCalls.push(col);
            return q;
          };
          q.then = (resolve: (v: unknown) => void) => {
            const count = calls.includes("email") ? counts.email : calls.includes("extra->meta->>ipHash") ? counts.ip : counts.global;
            resolve({ count: count ?? 0, error: counts.error ? { code: "x" } : null });
          };
          return q;
        },
      }),
      isServiceRoleConfigured: () => true,
    }));
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
    const { assertCareersApplyRateLimit } = await import("@/lib/security/rate-limit");
    return { result: await assertCareersApplyRateLimit({ email: "A@x.com", ipHash: "h" }), eqCalls };
  }

  it("allows under the limits and filters by exact columns", async () => {
    const { result, eqCalls } = await run({ email: 2, ip: 4, global: 300 });
    expect(result.ok).toBe(true);
    expect(eqCalls).toContain("extra->meta->>ipHash");
    expect(eqCalls).toContain("email");
  });
  it("blocks at 5 per IP hash", async () => {
    expect((await run({ ip: 5 })).result.ok).toBe(false);
  });
  it("blocks at 3 per email", async () => {
    expect((await run({ email: 3 })).result.ok).toBe(false);
  });
  it("blocks when more than 300 website applications in the window", async () => {
    expect((await run({ global: 301 })).result.ok).toBe(false);
  });
  it("fails closed on a database error", async () => {
    expect((await run({ error: true })).result.ok).toBe(false);
  });
});
