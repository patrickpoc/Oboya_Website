"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShopToolbarSelectOption<T extends string> {
  value: T;
  label: ReactNode;
  leading?: ReactNode;
}

interface ShopToolbarSelectProps<T extends string> {
  label: string;
  value: T | "";
  placeholder: string;
  options: ShopToolbarSelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  minMenuWidth?: number;
}

export function ShopToolbarSelect<T extends string>({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  className,
  minMenuWidth = 160,
}: ShopToolbarSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);

  const close = () => setOpen(false);

  const updateMenuBox = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, minMenuWidth),
    });
  };

  useEffect(() => {
    if (!open) return;
    updateMenuBox();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById(listId);
      if (menu?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onReposition = () => updateMenuBox();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [listId, open]);

  return (
    <div ref={rootRef} className={cn("relative block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex h-10 w-full items-center gap-2 overflow-hidden rounded-lg border border-border bg-white px-3 text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-oboya-green/40",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {selected?.leading}
        <span className="min-w-0 flex-1 truncate text-sm text-oboya-blue-dark">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && !disabled && menuBox
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              className="fixed z-[80] max-h-64 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-sm"
              style={{
                top: menuBox.top,
                left: menuBox.left,
                width: menuBox.width,
              }}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        close();
                      }}
                      className={cn(
                        "flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-oboya-blue-dark transition-colors",
                        isSelected
                          ? "bg-oboya-soft-white"
                          : "hover:bg-oboya-soft-white/80"
                      )}
                    >
                      {option.leading}
                      <span className="min-w-0 truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
