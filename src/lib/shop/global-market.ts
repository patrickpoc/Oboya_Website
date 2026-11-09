/** Display-only: the market flagged as "Global" in the CMS keeps its real code everywhere. */
export function isGlobalMarket(
  code: string | null | undefined,
  globalCountryCode: string | null | undefined
): boolean {
  if (!code || !globalCountryCode) return false;
  return code.trim().toUpperCase() === globalCountryCode.trim().toUpperCase();
}
