import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/auth/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
