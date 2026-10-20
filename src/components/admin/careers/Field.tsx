"use client";

import { Children, cloneElement, isValidElement, useId } from "react";
import { Label } from "@/components/ui/label";

/** Label + control; the first child element receives the generated id so the label is associated. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const items = Children.toArray(children);
  const first = items.findIndex((child) => isValidElement(child));
  const content = items.map((child, i) =>
    i === first && isValidElement<{ id?: string }>(child) ? cloneElement(child, { id: child.props.id ?? id }) : child
  );
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {content}
    </div>
  );
}
