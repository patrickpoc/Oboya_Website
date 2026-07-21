import { notFound } from "next/navigation";
import { isHomepageSectionSlug } from "@/lib/cms/homepage-sections";
import { HomepageSectionPage } from "@/components/admin/homepage/HomepageSectionPage";

type PageProps = {
  params: Promise<{ section: string }>;
};

export default async function HomepageSectionAdminPage({ params }: PageProps) {
  const { section } = await params;

  if (!isHomepageSectionSlug(section)) {
    notFound();
  }

  return <HomepageSectionPage section={section} />;
}
