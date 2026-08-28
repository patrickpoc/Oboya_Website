"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CmsLocale } from "@/lib/cms/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { BrandLabel } from "@/components/shop/BrandLabel";
import { CountryFlag } from "@/components/ui/country-flag";
import { useMapLocations } from "@/lib/shop/use-map-locations";
import { getMapFlagOptions } from "@/lib/shop/map-flag-options";
import type { FilterOption, ShopBrand, ShopCategory, ShopFilterOptions, ShopLocalizedText } from "@/lib/shop/types";

type OptionGroupKey = keyof ShopFilterOptions;
type SortMode = "name-asc" | "name-desc" | "usage-desc";
type UsageMode = "all" | "used" | "unused";

const FILTER_GROUPS: Array<{ key: OptionGroupKey; label: string }> = [
  { key: "applications", label: "Application" },
  { key: "cultures", label: "Crop / Culture" },
  { key: "certifications", label: "Certifications" },
  { key: "countriesOfOrigin", label: "Country of Manufacture" },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function pickLocalized(name: string, i18n: ShopLocalizedText | undefined, locale: CmsLocale) {
  const fromLocale = i18n?.[locale]?.trim();
  if (fromLocale) return fromLocale;
  const fromEn = i18n?.en?.trim();
  if (fromEn) return fromEn;
  return name;
}

function initI18n(name: string, i18n?: ShopLocalizedText): ShopLocalizedText {
  return {
    en: i18n?.en?.trim() || name,
    "pt-BR": i18n?.["pt-BR"] || "",
    es: i18n?.es || "",
    "zh-CN": i18n?.["zh-CN"] || "",
  };
}

function matchesUsage(usage: number, filter: UsageMode) {
  if (filter === "used") return usage > 0;
  if (filter === "unused") return usage === 0;
  return true;
}

function sortByMode<T extends { id: string; name: string }>(items: T[], mode: SortMode, usageMap: Record<string, number>) {
  return [...items].sort((a, b) => {
    if (mode === "usage-desc") return (usageMap[b.id] ?? 0) - (usageMap[a.id] ?? 0);
    if (mode === "name-desc") return b.name.localeCompare(a.name);
    return a.name.localeCompare(b.name);
  });
}

export default function MarketplaceFiltersPage() {
  const [activeTab, setActiveTab] = useState("taxonomy");
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [brands, setBrands] = useState<ShopBrand[]>([]);
  const [filterOptions, setFilterOptions] = useState<ShopFilterOptions>({
    applications: [],
    cultures: [],
    certifications: [],
    countriesOfOrigin: [],
  });
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchBrand, setSearchBrand] = useState("");
  const [searchOption, setSearchOption] = useState("");
  const [categorySort, setCategorySort] = useState<SortMode>("name-asc");
  const [brandSort, setBrandSort] = useState<SortMode>("name-asc");
  const [optionSort, setOptionSort] = useState<SortMode>("name-asc");
  const [categoryUsageFilter, setCategoryUsageFilter] = useState<UsageMode>("all");
  const [brandUsageFilter, setBrandUsageFilter] = useState<UsageMode>("all");
  const [optionUsageFilter, setOptionUsageFilter] = useState<UsageMode>("all");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<OptionGroupKey>("applications");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [brandSheetOpen, setBrandSheetOpen] = useState(false);
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [editingLocale, setEditingLocale] = useState<CmsLocale>("en");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLabel, setEditorLabel] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [editorAction, setEditorAction] = useState<((nextValue: string) => void) | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmBlocked, setConfirmBlocked] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const { data: mapLocations } = useMapLocations();
  const mapFlagOptions = useMemo(
    () => getMapFlagOptions(mapLocations),
    [mapLocations]
  );

  useEffect(() => {
    void (async () => {
      try {
        const [filtersResponse, productsResponse] = await Promise.all([
          fetch("/api/cms/marketplace/filters", { cache: "no-store" }),
          fetch("/api/cms/products?includeDeleted=1", { cache: "no-store" }),
        ]);
        if (!filtersResponse.ok) throw new Error("Could not load filters");
        const payload = (await filtersResponse.json()) as {
          categories: ShopCategory[];
          brands: ShopBrand[];
          filterOptions: ShopFilterOptions;
        };
        setCategories(payload.categories);
        setBrands(payload.brands);
        setFilterOptions(payload.filterOptions);
        setInitialSnapshot(JSON.stringify(payload));
        setSelectedCategoryId(payload.categories[0]?.id ?? null);
        setSelectedBrandId(payload.brands[0]?.id ?? null);
        setSelectedOptionId(payload.filterOptions.applications[0]?.id ?? null);
        if (productsResponse.ok) {
          const allProducts = (await productsResponse.json()) as CmsProduct[];
          setProducts(allProducts.filter((product) => !product.deletedAt));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categoryUsage = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.id,
          products.filter((product) => product.categoryId === category.id).length,
        ])
      ),
    [categories, products]
  );
  const brandUsage = useMemo(
    () =>
      Object.fromEntries(
        brands.map((brand) => [brand.id, products.filter((product) => product.brandId === brand.id).length])
      ),
    [brands, products]
  );
  const optionUsage = useMemo(() => {
    const map: Record<OptionGroupKey, Record<string, number>> = {
      applications: {},
      cultures: {},
      certifications: {},
      countriesOfOrigin: {},
    };
    FILTER_GROUPS.forEach((group) => {
      filterOptions[group.key].forEach((option) => {
        if (group.key === "applications") {
          map[group.key][option.id] = products.filter((product) => product.application.includes(option.id)).length;
        } else if (group.key === "cultures") {
          map[group.key][option.id] = products.filter((product) => product.cultures.includes(option.id)).length;
        } else if (group.key === "certifications") {
          map[group.key][option.id] = products.filter((product) => product.certifications.includes(option.id)).length;
        } else {
          map[group.key][option.id] = products.filter((product) => product.countryOfOrigin === option.id).length;
        }
      });
    });
    return map;
  }, [filterOptions, products]);

  const filteredCategories = useMemo(() => {
    const q = normalize(searchCategory);
    const matches = categories.filter((category) => {
      if (normalize(category.name).includes(q)) return true;
      return category.subcategories.some((subcategory) => normalize(subcategory.name).includes(q));
    });
    return sortByMode(
      matches.filter((category) => matchesUsage(categoryUsage[category.id] ?? 0, categoryUsageFilter)),
      categorySort,
      categoryUsage
    );
  }, [categories, searchCategory, categorySort, categoryUsage, categoryUsageFilter]);

  const filteredBrands = useMemo(() => {
    const q = normalize(searchBrand);
    const matches = brands.filter((brand) => normalize(brand.name).includes(q));
    return sortByMode(
      matches.filter((brand) => matchesUsage(brandUsage[brand.id] ?? 0, brandUsageFilter)),
      brandSort,
      brandUsage
    );
  }, [brands, searchBrand, brandSort, brandUsage, brandUsageFilter]);

  const filteredOptions = useMemo(() => {
    const q = normalize(searchOption);
    const list = filterOptions[selectedGroup] ?? [];
    const matches = list.filter((option) => normalize(option.name).includes(q));
    return sortByMode(
      matches.filter((option) => matchesUsage(optionUsage[selectedGroup][option.id] ?? 0, optionUsageFilter)),
      optionSort,
      optionUsage[selectedGroup]
    );
  }, [filterOptions, selectedGroup, searchOption, optionSort, optionUsage, optionUsageFilter]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? null;

  const currentSnapshot = JSON.stringify({ categories, brands, filterOptions });
  const isDirty = initialSnapshot !== "" && currentSnapshot !== initialSnapshot;

  const openTextEditor = (label: string, value: string, onConfirm: (nextValue: string) => void) => {
    setEditorLabel(label);
    setEditorValue(value);
    setEditorAction(() => onConfirm);
    setEditorOpen(true);
  };

  const openDeleteConfirm = (params: {
    title: string;
    description: string;
    blocked: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmTitle(params.title);
    setConfirmDescription(params.description);
    setConfirmBlocked(params.blocked);
    setConfirmAction(() => params.onConfirm);
    setConfirmOpen(true);
  };

  const validateLocal = () => {
    const issues: string[] = [];
    const categoryNames = new Set<string>();
    categories.forEach((category) => {
      const key = normalize(category.name);
      if (!key) issues.push("Category name cannot be empty.");
      if (categoryNames.has(key)) issues.push(`Duplicated category: ${category.name}`);
      categoryNames.add(key);
      const subNames = new Set<string>();
      category.subcategories.forEach((subcategory) => {
        const subKey = normalize(subcategory.name);
        if (!subKey) issues.push(`Subcategory cannot be empty in ${category.name}.`);
        if (subNames.has(subKey)) issues.push(`Duplicated subcategory in ${category.name}: ${subcategory.name}`);
        subNames.add(subKey);
      });
    });
    const brandNames = new Set<string>();
    brands.forEach((brand) => {
      const key = normalize(brand.name);
      if (!key) issues.push("Brand name cannot be empty.");
      if (brandNames.has(key)) issues.push(`Duplicated brand: ${brand.name}`);
      brandNames.add(key);
    });
    FILTER_GROUPS.forEach((group) => {
      const names = new Set<string>();
      filterOptions[group.key].forEach((option) => {
        const key = normalize(option.name);
        if (!key) issues.push(`${group.label} option name cannot be empty.`);
        if (names.has(key)) issues.push(`Duplicated ${group.label} option: ${option.name}`);
        names.add(key);
      });
    });
    return issues;
  };

  const saveAll = async () => {
    const issues = validateLocal();
    if (issues.length > 0) {
      toast.error(issues[0]);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/cms/marketplace/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories, brands, filterOptions }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Could not save filters");
      setInitialSnapshot(currentSnapshot);
      toast.success("Filters saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save filters.");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    openTextEditor("Create category", "", (value) => {
      const name = value.trim();
      if (!name) return;
      const next: ShopCategory = { id: newId("category"), name, nameI18n: initI18n(name), subcategories: [] };
      setCategories((prev) => [...prev, next]);
      setSelectedCategoryId(next.id);
      setSelectedSubcategoryId(null);
      setSheetOpen(true);
      setEditorOpen(false);
    });
  };

  const addSubcategory = (categoryId: string) => {
    openTextEditor("Create subcategory", "", (value) => {
      const name = value.trim();
      if (!name) return;
      setCategories((prev) =>
        prev.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: [
                  ...category.subcategories,
                  { id: newId("subcategory"), name, nameI18n: initI18n(name) },
                ],
              }
            : category
        )
      );
      setEditorOpen(false);
    });
  };

  const addBrand = () => {
    openTextEditor("Create brand", "", (value) => {
      const name = value.trim();
      if (!name) return;
      const next: ShopBrand = { id: newId("brand"), name, nameI18n: initI18n(name) };
      setBrands((prev) => [...prev, next]);
      setSelectedBrandId(next.id);
      setEditorOpen(false);
    });
  };

  const addOption = (group: OptionGroupKey) => {
    openTextEditor(`Add option to ${group}`, "", (value) => {
      const name = value.trim();
      if (!name) return;
      const next: FilterOption = { id: newId(group), name, nameI18n: initI18n(name) };
      setFilterOptions((prev) => ({ ...prev, [group]: [...prev[group], next] }));
      setSelectedOptionId(next.id);
      setEditorOpen(false);
    });
  };

  if (loading) {
    return (
      <Can module="marketplace" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
        <AdminPageHeader title="Filters" description="Loading taxonomy center..." />
      </Can>
    );
  }

  return (
    <Can module="marketplace" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <AdminPageHeader
        title="Filters"
        description="Centralize categories, brands and filter options used by products."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={isDirty ? "secondary" : "outline"}>
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </Badge>
            <Button
              onClick={() => void saveAll()}
              className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
              disabled={saving || !isDirty}
            >
              {saving ? "Saving..." : "Save filters"}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="taxonomy">Categories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="options">Product Filters</TabsTrigger>
        </TabsList>

        <TabsContent value="taxonomy">
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Category Tree</span>
                  <Button variant="outline" size="sm" onClick={addCategory}>
                    <Plus className="mr-1 size-3.5" /> Add category
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search categories or subcategories..."
                    value={searchCategory}
                    onChange={(event) => setSearchCategory(event.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={categoryUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("all")}>All</Button>
                  <Button size="sm" variant={categoryUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("used")}>Used</Button>
                  <Button size="sm" variant={categoryUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("unused")}>Unused</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("name-asc")}>A-Z</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("name-desc")}>Z-A</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("usage-desc")}>Most used</Button>
                </div>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="rounded-lg border border-border/60 p-2">
                      <div className="flex w-full items-center justify-between gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-left text-sm font-medium text-oboya-blue-dark hover:underline"
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setSelectedSubcategoryId(null);
                          }}
                        >
                          <FolderTree className="size-3.5 text-muted-foreground" />
                          {pickLocalized(category.name, category.nameI18n, editingLocale)}
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Editar categoria ${pickLocalized(category.name, category.nameI18n, editingLocale)}`}
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setSelectedSubcategoryId(null);
                              setSheetOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            aria-label={`Remover categoria ${pickLocalized(category.name, category.nameI18n, editingLocale)}`}
                            onClick={() => {
                              const inUse = categoryUsage[category.id] ?? 0;
                              openDeleteConfirm({
                                title: "Delete category",
                                description:
                                  inUse > 0
                                    ? `This category is currently used by ${inUse} product(s). Remove associations before deleting.`
                                    : "This will remove the category and all nested subcategories.",
                                blocked: inUse > 0,
                                onConfirm: () => {
                                  setCategories((prev) => prev.filter((item) => item.id !== category.id));
                                  if (selectedCategoryId === category.id) {
                                    setSelectedCategoryId(null);
                                    setSelectedSubcategoryId(null);
                                  }
                                  setConfirmOpen(false);
                                },
                              });
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 border-l border-border/60 pl-3">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id} className="rounded px-1 py-0.5 text-xs hover:bg-muted/50">
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-left hover:underline"
                              onClick={() => {
                                setSelectedCategoryId(category.id);
                                setSelectedSubcategoryId(subcategory.id);
                              }}
                            >
                              <Tag className="size-3 text-muted-foreground" />
                              {pickLocalized(subcategory.name, subcategory.nameI18n, editingLocale)}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Site Reflection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-oboya-green/10 px-3 py-2 text-sm font-medium">All categories</div>
                <div className="space-y-2">
                  {categories.slice(0, 8).map((category) => (
                    <p key={`preview-category-${category.id}`} className="text-sm text-oboya-blue-dark">
                      {pickLocalized(category.name, category.nameI18n, editingLocale)}
                    </p>
                  ))}
                </div>
                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase">Brands</p>
                  {brands.slice(0, 6).map((brand) => (
                    <label key={`preview-brand-${brand.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                      <input type="checkbox" disabled />
                      <BrandLabel
                        brand={brand}
                        locale={editingLocale}
                      />
                    </label>
                  ))}
                </div>
                {FILTER_GROUPS.map((group) => (
                  <div key={`preview-group-${group.key}`} className="border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase">{group.label}</p>
                    {filterOptions[group.key].slice(0, 6).map((option) => (
                      <label key={`preview-option-${option.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                        <input type="checkbox" disabled />
                        {pickLocalized(option.name, option.nameI18n, editingLocale)}
                      </label>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brands">
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Brands</span>
                  <Button variant="outline" size="sm" onClick={addBrand}>
                    <Plus className="mr-1 size-3.5" /> Add brand
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search brand..." value={searchBrand} onChange={(event) => setSearchBrand(event.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={brandUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("all")}>All</Button>
                  <Button size="sm" variant={brandUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("used")}>Used</Button>
                  <Button size="sm" variant={brandUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("unused")}>Unused</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("name-asc")}>A-Z</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("name-desc")}>Z-A</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("usage-desc")}>Most used</Button>
                </div>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {filteredBrands.map((brand) => (
                    <div key={brand.id} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${selectedBrandId === brand.id ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}>
                      <button type="button" className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-oboya-blue-dark hover:underline" onClick={() => setSelectedBrandId(brand.id)}>
                        <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                        <BrandLabel brand={brand} locale={editingLocale} />
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Editar marca ${pickLocalized(brand.name, brand.nameI18n, editingLocale)}`}
                          onClick={() => {
                            setSelectedBrandId(brand.id);
                            setBrandSheetOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          aria-label={`Remover marca ${pickLocalized(brand.name, brand.nameI18n, editingLocale)}`}
                          onClick={() => {
                            const used = brandUsage[brand.id] ?? 0;
                            openDeleteConfirm({
                              title: "Delete brand",
                              description: used > 0 ? `This brand is used by ${used} product(s).` : "This brand will be removed.",
                              blocked: used > 0,
                              onConfirm: () => {
                                setBrands((prev) => prev.filter((item) => item.id !== brand.id));
                                if (selectedBrandId === brand.id) setSelectedBrandId(null);
                                setConfirmOpen(false);
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Site Reflection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-semibold uppercase text-oboya-blue-dark">Brands</p>
                {brands.slice(0, 12).map((brand) => (
                  <label key={`brands-preview-${brand.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                    <input type="checkbox" disabled />
                    <BrandLabel brand={brand} locale={editingLocale} />
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options">
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader><CardTitle>Filter Groups</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {FILTER_GROUPS.map((group) => (
                  <div
                    key={group.key}
                    className={`rounded-lg border px-3 py-2 ${selectedGroup === group.key ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-oboya-blue-dark hover:underline"
                        onClick={() => {
                          setSelectedGroup(group.key);
                          setSelectedOptionId(filterOptions[group.key][0]?.id ?? null);
                        }}
                      >
                        {group.label}
                      </button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Editar grupo ${group.label}`}
                        onClick={() => {
                          setSelectedGroup(group.key);
                          setSelectedOptionId(filterOptions[group.key][0]?.id ?? null);
                          setOptionSheetOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-1 border-l border-border/60 pl-3">
                      {(filterOptions[group.key] ?? []).slice(0, 4).map((option) => (
                        <button
                          key={`group-preview-${group.key}-${option.id}`}
                          type="button"
                          className="block text-left text-xs text-muted-foreground hover:text-oboya-blue-dark"
                          onClick={() => {
                            setSelectedGroup(group.key);
                            setSelectedOptionId(option.id);
                          }}
                        >
                          {pickLocalized(option.name, option.nameI18n, editingLocale)}
                        </button>
                      ))}
                      {filterOptions[group.key].length > 4 && (
                        <p className="text-[11px] text-muted-foreground">
                          +{filterOptions[group.key].length - 4} more options
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Use the edit button on a filter group to manage options in the side panel.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Site Reflection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {FILTER_GROUPS.map((group) => (
                  <div key={`options-preview-${group.key}`} className="border-b border-border/60 pb-3 last:border-b-0">
                    <p className="mb-2 text-xs font-semibold uppercase text-oboya-blue-dark">{group.label}</p>
                    {filterOptions[group.key].slice(0, 8).map((option) => (
                      <label key={`options-preview-item-${option.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                        <input type="checkbox" disabled />
                        {pickLocalized(option.name, option.nameI18n, editingLocale)}
                      </label>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Taxonomy Details</SheetTitle>
            <SheetDescription>Manage category and subcategories in a side panel.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            {!selectedCategory && <p className="text-sm text-muted-foreground">Select a category first.</p>}
            {selectedCategory && (
              <>
                <div className="rounded-lg border border-border/60 p-3">
                  <Label>Category</Label>
                  <Input
                    className="mt-2"
                    value={selectedCategory.name}
                    onChange={(event) =>
                      setCategories((prev) =>
                        prev.map((category) =>
                          category.id === selectedCategory.id
                            ? {
                                ...category,
                                name: event.target.value,
                                nameI18n: { ...initI18n(event.target.value, category.nameI18n), en: event.target.value },
                              }
                            : category
                        )
                      )
                    }
                  />
                  <LocaleFieldTabs value={editingLocale} onChange={setEditingLocale}>
                    {(locale) => (
                      <Input
                        className="mt-2"
                        value={selectedCategory.nameI18n?.[locale] ?? ""}
                        placeholder={locale === "en" ? "Required" : "Optional (falls back to English)"}
                        onChange={(event) =>
                          setCategories((prev) =>
                            prev.map((category) =>
                              category.id === selectedCategory.id
                                ? {
                                    ...category,
                                    nameI18n: {
                                      ...initI18n(category.name, category.nameI18n),
                                      [locale]: event.target.value,
                                    },
                                  }
                                : category
                            )
                          )
                        }
                      />
                    )}
                  </LocaleFieldTabs>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Subcategories</Label>
                    <Button size="sm" variant="outline" onClick={() => addSubcategory(selectedCategory.id)}>
                      <Plus className="mr-1 size-3.5" /> Add subcategory
                    </Button>
                  </div>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="space-y-2 rounded-lg border border-border/60 p-2">
                      <Input
                        value={subcategory.name}
                        onFocus={() => setSelectedSubcategoryId(subcategory.id)}
                        onChange={(event) =>
                          setCategories((prev) =>
                            prev.map((category) =>
                              category.id === selectedCategory.id
                                ? {
                                    ...category,
                                    subcategories: category.subcategories.map((item) =>
                                      item.id === subcategory.id
                                        ? {
                                            ...item,
                                            name: event.target.value,
                                            nameI18n: { ...initI18n(event.target.value, item.nameI18n), en: event.target.value },
                                          }
                                        : item
                                    ),
                                  }
                                : category
                            )
                          )
                        }
                      />
                      {selectedSubcategoryId === subcategory.id && (
                        <LocaleFieldTabs value={editingLocale} onChange={setEditingLocale}>
                          {(locale) => (
                            <Input
                              value={subcategory.nameI18n?.[locale] ?? ""}
                              placeholder={locale === "en" ? "Required" : "Optional (falls back to English)"}
                              onChange={(event) =>
                                setCategories((prev) =>
                                  prev.map((category) =>
                                    category.id === selectedCategory.id
                                      ? {
                                          ...category,
                                          subcategories: category.subcategories.map((item) =>
                                            item.id === subcategory.id
                                              ? {
                                                  ...item,
                                                  nameI18n: {
                                                    ...initI18n(item.name, item.nameI18n),
                                                    [locale]: event.target.value,
                                                  },
                                                }
                                              : item
                                          ),
                                        }
                                      : category
                                  )
                                )
                              }
                            />
                          )}
                        </LocaleFieldTabs>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={brandSheetOpen} onOpenChange={setBrandSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Brand Details</SheetTitle>
            <SheetDescription>Edit localized labels with English fallback.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            {!selectedBrand && <p className="text-sm text-muted-foreground">Select a brand first.</p>}
            {selectedBrand && (
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <Label>English (fallback)</Label>
                <Input
                  value={selectedBrand.name}
                  onChange={(event) =>
                    setBrands((prev) =>
                      prev.map((brand) =>
                        brand.id === selectedBrand.id
                          ? {
                              ...brand,
                              name: event.target.value,
                              nameI18n: { ...initI18n(event.target.value, brand.nameI18n), en: event.target.value },
                            }
                          : brand
                      )
                    )
                  }
                />
                <LocaleFieldTabs value={editingLocale} onChange={setEditingLocale}>
                  {(locale) => (
                    <Input
                      value={selectedBrand.nameI18n?.[locale] ?? ""}
                      placeholder={locale === "en" ? "Required" : "Optional (falls back to English)"}
                      onChange={(event) =>
                        setBrands((prev) =>
                          prev.map((brand) =>
                            brand.id === selectedBrand.id
                              ? {
                                  ...brand,
                                  nameI18n: { ...initI18n(brand.name, brand.nameI18n), [locale]: event.target.value },
                                }
                              : brand
                          )
                        )
                      }
                    />
                  )}
                </LocaleFieldTabs>
                <div className="space-y-1.5">
                  <Label htmlFor="brand-flag">Country flag</Label>
                  <p className="text-xs text-muted-foreground">
                    Options from the Global Presence map. Leave empty to hide the flag in the shop.
                  </p>
                  <select
                    id="brand-flag"
                    value={selectedBrand.flag ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBrands((prev) =>
                        prev.map((brand) =>
                          brand.id === selectedBrand.id
                            ? { ...brand, flag: value || undefined }
                            : brand
                        )
                      );
                    }}
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">No flag</option>
                    {mapFlagOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedBrand.flag ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex h-3.5 w-[21px] overflow-hidden rounded-[2px] border border-border/40">
                        <CountryFlag
                          code={selectedBrand.flag}
                          className="block h-full w-full"
                        />
                      </span>
                      Shop preview
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Used by {brandUsage[selectedBrand.id] ?? 0} product(s)</p>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setBrandSheetOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={optionSheetOpen} onOpenChange={setOptionSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Filter Option Details</SheetTitle>
            <SheetDescription>Manage options from search controls downward in this panel.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                value={searchOption}
                onChange={(event) => setSearchOption(event.target.value)}
                placeholder="Search option..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={optionUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("all")}>All</Button>
              <Button size="sm" variant={optionUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("used")}>Used</Button>
              <Button size="sm" variant={optionUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("unused")}>Unused</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("name-asc")}>A-Z</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("name-desc")}>Z-A</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("usage-desc")}>Most used</Button>
            </div>

            <div className="space-y-2">
              {filteredOptions.map((option) => (
                <div key={option.id} className={`rounded-lg border px-3 py-2 ${selectedOptionId === option.id ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" className="text-left text-sm hover:underline" onClick={() => setSelectedOptionId(option.id)}>
                      {pickLocalized(option.name, option.nameI18n, editingLocale)}
                    </button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Remover opção ${pickLocalized(option.name, option.nameI18n, editingLocale)}`}
                      onClick={() => {
                        const used = optionUsage[selectedGroup][option.id] ?? 0;
                        openDeleteConfirm({
                          title: "Delete option",
                          description: used > 0 ? `This option is used by ${used} product(s).` : "This option will be removed.",
                          blocked: used > 0,
                          onConfirm: () => {
                            setFilterOptions((prev) => ({
                              ...prev,
                              [selectedGroup]: prev[selectedGroup].filter((item) => item.id !== option.id),
                            }));
                            if (selectedOptionId === option.id) setSelectedOptionId(null);
                            setConfirmOpen(false);
                          },
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {selectedOptionId === option.id && (
                    <div className="mt-3 space-y-2">
                      <Label>English (fallback)</Label>
                      <Input
                        value={option.name}
                        onChange={(event) =>
                          setFilterOptions((prev) => ({
                            ...prev,
                            [selectedGroup]: prev[selectedGroup].map((item) =>
                              item.id === option.id
                                ? {
                                    ...item,
                                    name: event.target.value,
                                    nameI18n: { ...initI18n(event.target.value, item.nameI18n), en: event.target.value },
                                  }
                                : item
                            ),
                          }))
                        }
                      />
                      <LocaleFieldTabs value={editingLocale} onChange={setEditingLocale}>
                        {(locale) => (
                          <Input
                            value={option.nameI18n?.[locale] ?? ""}
                            placeholder={locale === "en" ? "Required" : "Optional (falls back to English)"}
                            onChange={(event) =>
                              setFilterOptions((prev) => ({
                                ...prev,
                                [selectedGroup]: prev[selectedGroup].map((item) =>
                                  item.id === option.id
                                    ? {
                                        ...item,
                                        nameI18n: { ...initI18n(item.name, item.nameI18n), [locale]: event.target.value },
                                      }
                                    : item
                                ),
                              }))
                            }
                          />
                        )}
                      </LocaleFieldTabs>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => addOption(selectedGroup)}>
              <Plus className="mr-1 size-3.5" /> Add option
            </Button>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOptionSheetOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editorLabel}</DialogTitle>
            <DialogDescription>Provide a unique and descriptive name.</DialogDescription>
          </DialogHeader>
          <Input value={editorValue} onChange={(event) => setEditorValue(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={() => editorAction?.(editorValue)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>{confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant={confirmBlocked ? "outline" : "destructive"} disabled={confirmBlocked} onClick={() => confirmAction?.()}>
              {confirmBlocked ? "Cannot delete" : "Confirm delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Can>
  );
}

