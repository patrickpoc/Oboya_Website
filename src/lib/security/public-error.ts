import { NextResponse } from "next/server";

export function publicApiError(
  logMessage: unknown,
  clientMessage = "Request failed",
  status = 500
) {
  console.error(logMessage);
  return NextResponse.json({ error: clientMessage }, { status });
}
