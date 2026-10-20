import { NextResponse } from "next/server";
import { validateCvFile } from "@/lib/cms/careers/validation";
import {
  clearApplicationCv,
  getApplication,
  setApplicationCv,
} from "@/lib/cms/server/careers-applications.server";
import { CareersError, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import {
  createCvDownloadUrl,
  createCvUploadUrl,
  verifyCvObject,
} from "@/lib/cms/server/careers-cv.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ id: string }> };

async function requireApplication(id: string) {
  const app = await getApplication(id);
  if (!app) throw new CareersError(404, "not_found");
  if (app.anonymizedAt) throw new CareersError(409, "anonymized");
  return app;
}

/** POST { filename, mime, size } -> { path, signedUrl, token } for a direct storage upload. */
export async function POST(request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    await requireApplication(id);
    const body = (await request.json().catch(() => null)) as { mime?: string; size?: number } | null;
    const mime = String(body?.mime ?? "").toLowerCase();
    const size = Number(body?.size);
    const upload = await createCvUploadUrl({ applicationId: id, mime, size });
    return NextResponse.json(upload, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to prepare CV upload");
  }
}

/** PUT { path, filename } after the upload: verifies the object, then saves the metadata. */
export async function PUT(request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    await requireApplication(id);
    const body = (await request.json().catch(() => null)) as { path?: string; filename?: string } | null;
    const path = String(body?.path ?? "");
    const verified = await verifyCvObject(id, path);
    const check = validateCvFile(verified.mime, verified.size);
    if (!check.ok) throw new CareersError(400, check.errors[0]);
    const filename = String(body?.filename ?? "cv").replace(/[\\/\r\n]/g, "_").slice(0, 255) || "cv";
    const item = await setApplicationCv(
      id,
      { path, filename, mime: verified.mime, size: verified.size },
      { id: auth.user.id, name: auth.user.name }
    );
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to save CV");
  }
}

/** GET -> { url, expiresIn } signed download URL (60 s). */
export async function GET(_request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const app = await getApplication((await context.params).id);
    if (!app?.cvPath) throw new CareersError(404, "cv_not_found");
    return NextResponse.json(await createCvDownloadUrl(app.cvPath, app.cvFilename), { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to create download link");
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const item = await clearApplicationCv((await context.params).id, {
      id: auth.user.id,
      name: auth.user.name,
    });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to remove CV");
  }
}
