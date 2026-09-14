import { NextResponse } from "next/server";
import { purgeFormSubmissionsOlderThan } from "@/lib/cms/server/forms.server";
import { FORM_RETENTION_DAYS } from "@/lib/security/privacy-notice";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const removed = await purgeFormSubmissionsOlderThan(FORM_RETENTION_DAYS);
    return NextResponse.json({ ok: true, removed });
  } catch (error) {
    console.error("Form purge failed:", error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
