import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

/** Map lives on About Us — keep /map as a stable redirect. */
export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/about#global-presence`);
}
