import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { MapLocationEditor } from "@/components/admin/MapLocationEditor";

export default function GlobalMapPage() {
  return (
    <div>
      <AdminPageHeader
        title="Interactive Map"
        description="Manage countries, offices, and marker positions on the global map."
      />
      <MapLocationEditor />
    </div>
  );
}
