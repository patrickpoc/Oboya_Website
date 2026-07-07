import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "article" | "main";
  size?: "default" | "narrow" | "wide";
}

const sizeClasses = {
  default: "max-w-[var(--container-max)]",
  narrow: "max-w-3xl",
  wide: "max-w-[90rem]",
};

export function Container({
  as: Component = "div",
  size = "default",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-[var(--container-padding)]",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
