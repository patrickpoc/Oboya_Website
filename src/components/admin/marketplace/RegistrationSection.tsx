"use client";

import type { ReactNode } from "react";

interface RegistrationSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  isFirst?: boolean;
}

export function RegistrationSection({
  title,
  description,
  children,
  isFirst = false,
}: RegistrationSectionProps) {
  return (
    <section
      className={
        isFirst
          ? "space-y-3"
          : "space-y-3 border-t border-border/60 pt-5"
      }
    >
      <div>
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
