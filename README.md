# Oboya Website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Product ID = SKU migration

Canonical product identity is `product.id === product.sku` (trimmed). Color children use `colorVariants[].id === colorVariants[].sku`.

### Bulk Update (parent + color groups)

- Selecting any parent or child SKU expands the full group (parent row + indented color rows).
- Limit is **100 products / color groups** (not each color row).
- One PUT per `productId` applies parent taxonomy/MOQ/status plus variant price/color/image patches.

### Run the one-shot migration

```bash
# Validate only (no writes)
npm run migrate:product-ids -- --dry-run

# Apply (backs up products.json → products.json.bak, writes remap)
npm run migrate:product-ids -- --backup
```

What remaps:

- `product.id` → `product.sku` when they differ
- `relatedProductIds` via the product remap
- `colorVariants[].id` → `colorVariants[].sku` (skips `__default__`); remaps matching `imageColorIds` tags
- Writes `data/shop/product-id-remap.json` for cart hydrate (`oboya-shop-quote`) and soft-open `?product=` bookmarks
- Shop PDP URLs use `/shop/products/{sku}` with a permanent redirect from legacy ids

Historical RFQ rows keep old `productId` values (UI already shows SKU).
