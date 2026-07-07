import { Suspense } from "react";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
