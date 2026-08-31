import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const DECORATIVE_IMAGE = {
  src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=400&auto=format&fit=crop",
  fallback: "OB",
  alt: "Greenhouse plants",
} as const;

export interface NotFoundPageProps {
  title: string;
  description: string;
  backHomeLabel: string;
  homeHref?: string;
  className?: string;
}

export function NotFoundPage({
  title,
  description,
  backHomeLabel,
  homeHref = "/",
  className,
}: NotFoundPageProps) {
  return (
    <Empty className={cn("w-full max-w-lg border-none", className)}>
      <EmptyHeader>
        <EmptyMedia>
          <Avatar className="size-28 ring-4 ring-background md:size-32">
            <AvatarImage src={DECORATIVE_IMAGE.src} alt={DECORATIVE_IMAGE.alt} />
            <AvatarFallback>{DECORATIVE_IMAGE.fallback}</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <p className="text-sm font-medium tracking-[0.2em] text-oboya-green uppercase">
          404
        </p>
        <EmptyTitle className="font-display text-2xl font-semibold text-oboya-blue-dark md:text-3xl">
          {title}
        </EmptyTitle>
        <EmptyDescription className="max-w-md">{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href={homeHref}
          className={buttonVariants({
            size: "cta",
            className: "bg-oboya-green text-white hover:bg-oboya-green/90",
          })}
        >
          {backHomeLabel}
        </Link>
      </EmptyContent>
    </Empty>
  );
}
