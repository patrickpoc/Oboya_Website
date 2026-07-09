"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface DownloadsListProps {
  documents: { title: string; url: string; type: string }[];
}

export function DownloadsList({ documents }: DownloadsListProps) {
  const t = useTranslations("shop");

  if (documents.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-oboya-blue-dark">
        {t("downloads")}
      </h3>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.title}>
            <Link
              href={doc.url}
              className="flex items-center gap-2 text-sm text-oboya-green hover:underline"
            >
              <FileText className="size-4" aria-hidden />
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
