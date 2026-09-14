/**
 * Shop catalog and PDPs must never inherit the locale layout ISR (3600s).
 * Product JSON is loaded client-side, but HTML/RSC payloads still age
 * if this segment stays static.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
