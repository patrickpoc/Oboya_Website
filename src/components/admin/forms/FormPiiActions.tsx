"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FormPiiActions({
  id,
  onDone,
}: {
  id: string;
  onDone: () => void;
}) {
  const run = async (anonymize: boolean) => {
    const confirmed = window.confirm(
      anonymize
        ? "Anonymize this submission? Personal fields will be replaced."
        : "Permanently delete this submission?"
    );
    if (!confirmed) return;
    try {
      const params = new URLSearchParams({ id });
      if (anonymize) params.set("anonymize", "1");
      const res = await fetch(`/api/cms/forms?${params.toString()}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Request failed");
      }
      toast.success(anonymize ? "Submission anonymized" : "Submission deleted");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void run(true)}>
        Anonymize
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-oboya-orange"
        onClick={() => void run(false)}
      >
        Delete
      </Button>
    </>
  );
}
