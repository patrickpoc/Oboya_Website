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
  const firstElement = items[first];
  const controlId = isValidElement<{ id?: string }>(firstElement) ? firstElement.props.id ?? id : id;
  const content = items.map((child, i) =>
    i === first && isValidElement<{ id?: string }>(child) ? cloneElement(child, { id: controlId }) : child
  );
  return (
    <div className={`min-w-0 space-y-1.5 [&_input]:min-h-10 [&_select]:min-h-10 [&_select]:max-w-full [&_textarea]:focus-visible:outline-oboya-blue ${className ?? ""}`}>
      <Label htmlFor={controlId}>{label}</Label>
      {content}
    </div>
  );
}
