import type { DashboardStats } from "@/lib/cms/types";

export function getDashboardStats(): DashboardStats {
  return {
    products: 30,
    pendingQuotes: 7,
    formSubmissions: 24,
    visitors: 3842,
    activeCountries: 6,
    publishedPosts: 3,
    openJobs: 4,
  };
}

export const dashboardChartData = [
  { month: "Jan", visitors: 2100, quotes: 12 },
  { month: "Feb", visitors: 2400, quotes: 15 },
  { month: "Mar", visitors: 2800, quotes: 18 },
  { month: "Apr", visitors: 3100, quotes: 22 },
  { month: "May", visitors: 3400, quotes: 19 },
  { month: "Jun", visitors: 3600, quotes: 25 },
  { month: "Jul", visitors: 3842, quotes: 28 },
];

export const recentActivity = [
  { id: "1", action: "New quote request", module: "Marketplace", time: "2h ago" },
  { id: "2", action: "Blog post published", module: "Blog", time: "5h ago" },
  { id: "3", action: "Map office updated", module: "Global Presence", time: "1d ago" },
  { id: "4", action: "Product MOQ changed", module: "Marketplace", time: "2d ago" },
  { id: "5", action: "Contact form received", module: "Forms", time: "3d ago" },
];
