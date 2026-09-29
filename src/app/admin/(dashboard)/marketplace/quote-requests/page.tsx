import { redirect } from "next/navigation";

export default function QuoteRequestsRedirect() {
  redirect("/admin/forms/quotes");
}
