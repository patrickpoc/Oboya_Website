import { MapLocationEditor } from "@/components/admin/MapLocationEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map Locations | Oboya Admin",
  robots: { index: false, follow: false },
};

export default function AdminMapPage() {
  return <MapLocationEditor />;
}
