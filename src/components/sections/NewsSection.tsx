import { News, type NewsPreviewItem } from "@/components/sections/News";
import { readBlogPosts } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";

interface NewsSectionProps {
  locale: string;
}

export function NewsSection({ locale }: NewsSectionProps) {
  const items: NewsPreviewItem[] = readBlogPosts()
    .slice(0, 2)
    .map((post) => ({
      title: pickLocalized(post.title, locale),
      image: post.featuredImage,
      href: `/news/${post.slug}`,
    }));

  return <News items={items} />;
}
