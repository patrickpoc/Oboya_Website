"use client";

import { useMemo } from "react";
import type { ShopFilterTarget } from "@/lib/solutions/types";
import type { ShopBrand, ShopCategory, ShopFilterOptions } from "@/lib/shop/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShopFilterTargetFieldsProps {
  value: ShopFilterTarget;
  onChange: (next: ShopFilterTarget) => void;
  filterOptions: ShopFilterOptions;
  categories: ShopCategory[];
  brands: ShopBrand[];
  className?: string;
}

function toggleId(list: string[] | undefined, id: string): string[] {
  const current = list ?? [];
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
}

function OptionChecklist({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Array<{ id: string; name: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-oboya-blue-dark">
        {title}
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                checked && "bg-oboya-green/5"
              )}
            >
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={checked}
                onChange={() => onToggle(option.id)}
              />
              <span className="truncate">{option.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ShopFilterTargetFields({
  value,
  onChange,
  filterOptions,
  categories,
  brands,
  className,
}: ShopFilterTargetFieldsProps) {
  const subcategoryOptions = useMemo(() => {
    return categories.flatMap((category) =>
      category.subcategories.map((sub) => ({
        id: sub.id,
        name: `${category.name} › ${sub.name}`,
      }))
    );
  }, [categories]);

  return (
    <div className={cn("space-y-4 rounded-lg border border-border/60 p-3", className)}>
      <p className="text-xs text-muted-foreground">
        Shop filters applied when this item is clicked. Crop filters and banner
        filters are combined.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="shop-q">Search query (optional)</Label>
        <Input
          id="shop-q"
          value={value.q ?? ""}
          onChange={(event) =>
            onChange({ ...value, q: event.target.value || undefined })
          }
          placeholder="e.g. trays"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shop-category">Category</Label>
        <select
          id="shop-category"
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          value={value.categoryId ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              categoryId: event.target.value || null,
            })
          }
        >
          <option value="">Any category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <OptionChecklist
        title="Cultures / Crops"
        options={filterOptions.cultures ?? []}
        selected={value.cultures ?? []}
        onToggle={(id) =>
          onChange({ ...value, cultures: toggleId(value.cultures, id) })
        }
      />

      <OptionChecklist
        title="Applications / Stages"
        options={filterOptions.applications ?? []}
        selected={value.applications ?? []}
        onToggle={(id) =>
          onChange({
            ...value,
            applications: toggleId(value.applications, id),
          })
        }
      />

      <OptionChecklist
        title="Certifications"
        options={filterOptions.certifications ?? []}
        selected={value.certifications ?? []}
        onToggle={(id) =>
          onChange({
            ...value,
            certifications: toggleId(value.certifications, id),
          })
        }
      />

      <OptionChecklist
        title="Subcategories"
        options={subcategoryOptions}
        selected={value.subcategoryIds ?? []}
        onToggle={(id) =>
          onChange({
            ...value,
            subcategoryIds: toggleId(value.subcategoryIds, id),
          })
        }
      />

      <OptionChecklist
        title="Brands"
        options={brands}
        selected={value.brandIds ?? []}
        onToggle={(id) =>
          onChange({ ...value, brandIds: toggleId(value.brandIds, id) })
        }
      />

      <OptionChecklist
        title="Country of manufacture"
        options={filterOptions.countriesOfOrigin ?? []}
        selected={value.countriesOfOrigin ?? []}
        onToggle={(id) =>
          onChange({
            ...value,
            countriesOfOrigin: toggleId(value.countriesOfOrigin, id),
          })
        }
      />
    </div>
  );
}
