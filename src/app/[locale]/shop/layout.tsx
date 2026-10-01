/**
 * Shop HTML is a static shell: the catalog loads client-side from the
 * tag-invalidated `/api/shop/catalog`, and PDPs are cached per product until
 * a CMS write busts that product's tag.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
