/** Images used across Solutions (catalog cards, categories, hero carousel). */
export const SOLUTIONS_HERO_IMAGES = [
  "/assets/homepage/solutions-integrated.jpg",
  "/assets/homepage/solutions-logistics.jpg",
  "/assets/homepage/solutions-global.jpg",
  "/assets/homepage/greenhouse-technology.webp",
  "/assets/homepage/capabilities-value-chain.jpg",
  "/assets/homepage/capabilities-global-local.jpg",
] as const;

export function uniqueSolutionImages(images: string[]): string[] {
  return [...new Set(images.filter(Boolean))];
}
