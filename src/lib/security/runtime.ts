export function isHostedRuntime() {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export function isProductionLike() {
  return isHostedRuntime() || process.env.NODE_ENV === "production";
}
