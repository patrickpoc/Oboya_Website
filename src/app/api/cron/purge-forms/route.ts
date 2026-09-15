import { NextResponse } from "next/server";
import { purgeFormSubmissionsOlderThan } from "@/lib/cms/server/forms.server";
import { purgeExpiredProducts } from "@/lib/cms/server/products.server";
import { FORM_RETENTION_DAYS } from "@/lib/security/privacy-notice";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [formsRemoved, productsRemoved] = await Promise.all([
      purgeFormSubmissionsOlderThan(FORM_RETENTION_DAYS),
      purgeExpiredProducts({ asAdmin: true }),
    ]);
    return NextResponse.json({
      ok: true,
      formsRemoved,
      productsRemoved,
      // Backward-compatible alias
      removed: formsRemoved,
    });
  } catch (error) {
    console.error("Purge cron failed:", error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
