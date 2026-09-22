"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FolderTree, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { ShopLocalizedNameFields } from "@/components/admin/forms/ShopLocalizedNameFields";
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
import { useAdminLocale } from "@/contexts/AdminLocaleContext";
import { useMapLocations } from "@/lib/shop/use-map-locations";
import { getMapFlagOptions } from "@/lib/shop/map-flag-options";
import {
  countGroupUsage,
  countOptionUsage,
  emptyShopFilterOptions,
  initFilterGroupI18n,
  normalizeFilterGroups,
  normalizeFilterOptions,
  uniqueOptionId,
} from "@/lib/shop/filter-groups";
import type {
  FilterOption,
  ShopBrand,
  ShopCategory,
  ShopFilterGroup,
  ShopFilterOptions,
  ShopLocalizedText,
} from "@/lib/shop/types";

type SortMode = "name-asc" | "name-desc" | "usage-desc";
type UsageMode = "all" | "used" | "unused";

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
  const t = useTranslations("admin.filters");
  const tCommon = useTranslations("admin.common");
  const { locale } = useAdminLocale();
  const [activeTab, setActiveTab] = useState("taxonomy");
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [brands, setBrands] = useState<ShopBrand[]>([]);
  const [filterGroups, setFilterGroups] = useState<ShopFilterGroup[]>([]);
  const [filterOptions, setFilterOptions] = useState<ShopFilterOptions>(emptyShopFilterOptions());
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
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [brandSheetOpen, setBrandSheetOpen] = useState(false);
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
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

  const groupLabel = (groupId: string) => {
    const group = filterGroups.find((item) => item.id === groupId);
    if (!group) return groupId;
    return pickLocalized(group.name, group.nameI18n, locale);
  };

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
          filterGroups?: ShopFilterGroup[];
          filterOptions: ShopFilterOptions;
        };
        const normalizedOptions = normalizeFilterOptions(payload.filterOptions, payload.filterGroups);
        const normalizedGroups = normalizeFilterGroups(payload.filterGroups, normalizedOptions);
        const snapshot = {
          categories: payload.categories,
          brands: payload.brands,
          filterGroups: normalizedGroups,
          filterOptions: normalizedOptions,
        };
        setCategories(payload.categories);
        setBrands(payload.brands);
        setFilterGroups(normalizedGroups);
        setFilterOptions(normalizedOptions);
        setInitialSnapshot(JSON.stringify(snapshot));
        setSelectedCategoryId(payload.categories[0]?.id ?? null);
        setSelectedBrandId(payload.brands[0]?.id ?? null);
        const firstGroupId = normalizedGroups[0]?.id ?? "";
        setSelectedGroup(firstGroupId);
        setSelectedOptionId(normalizedOptions[firstGroupId]?.[0]?.id ?? null);
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
    const map: Record<string, Record<string, number>> = {};
    filterGroups.forEach((group) => {
      map[group.id] = {};
      (filterOptions[group.id] ?? []).forEach((option) => {
        map[group.id][option.id] = countOptionUsage(group.id, option.id, products);
      });
    });
    return map;
  }, [filterGroups, filterOptions, products]);
  const groupUsage = useMemo(
    () =>
      Object.fromEntries(
        filterGroups.map((group) => [group.id, countGroupUsage(group.id, products)])
      ),
    [filterGroups, products]
  );

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
      matches.filter((option) => matchesUsage(optionUsage[selectedGroup]?.[option.id] ?? 0, optionUsageFilter)),
      optionSort,
      optionUsage[selectedGroup] ?? {}
    );
  }, [filterOptions, selectedGroup, searchOption, optionSort, optionUsage, optionUsageFilter]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? null;
  const selectedGroupEntry = filterGroups.find((group) => group.id === selectedGroup) ?? null;

  const currentSnapshot = JSON.stringify({ categories, brands, filterGroups, filterOptions });
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
    const groupNames = new Set<string>();
    filterGroups.forEach((group) => {
      const groupKey = normalize(group.name);
      if (!groupKey) issues.push("Filter group name cannot be empty.");
      if (groupNames.has(groupKey)) issues.push(`Duplicated filter group: ${group.name}`);
      groupNames.add(groupKey);
      const label = groupLabel(group.id);
      const names = new Set<string>();
      (filterOptions[group.id] ?? []).forEach((option) => {
        const key = normalize(option.name);
        if (!key) issues.push(`${label} option name cannot be empty.`);
        if (names.has(key)) issues.push(`Duplicated ${label} option: ${option.name}`);
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
        body: JSON.stringify({ categories, brands, filterGroups, filterOptions }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? t("saveFailed"));
      setInitialSnapshot(currentSnapshot);
      toast.success(t("saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    openTextEditor(t("addCategory"), "", (value) => {
      const name = value.trim();
      if (!name) return;
      const id = uniqueOptionId(name, categories);
      const next: ShopCategory = {
        id,
        name,
        nameI18n: initI18n(name),
        slug: id,
        subcategories: [],
      };
      setCategories((prev) => [...prev, next]);
      setSelectedCategoryId(next.id);
      setSelectedSubcategoryId(null);
      setSheetOpen(true);
      setEditorOpen(false);
    });
  };

  const addSubcategory = (categoryId: string) => {
    openTextEditor(t("addSubcategory"), "", (value) => {
      const name = value.trim();
      if (!name) return;
      setCategories((prev) => {
        const existingSubs = prev.flatMap((category) => category.subcategories);
        const id = uniqueOptionId(name, existingSubs);
        return prev.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subcategories: [
                  ...category.subcategories,
                  { id, name, nameI18n: initI18n(name), slug: id },
                ],
              }
            : category
        );
      });
      setEditorOpen(false);
    });
  };

  const addBrand = () => {
    openTextEditor(t("addBrand"), "", (value) => {
      const name = value.trim();
      if (!name) return;
      const id = uniqueOptionId(name, brands);
      const next: ShopBrand = {
        id,
        name,
        nameI18n: initI18n(name),
        slug: id,
      };
      setBrands((prev) => [...prev, next]);
      setSelectedBrandId(next.id);
      setEditorOpen(false);
    });
  };

  const addFilterGroup = () => {
    openTextEditor(t("addGroup"), "", (value) => {
      const name = value.trim();
      if (!name) return;
      const id = uniqueOptionId(name, filterGroups);
      const next: ShopFilterGroup = {
        id,
        name,
        nameI18n: initFilterGroupI18n(name),
      };
      setFilterGroups((prev) => [...prev, next]);
      setFilterOptions((prev) => ({ ...prev, [next.id]: [] }));
      setSelectedGroup(next.id);
      setSelectedOptionId(null);
      setOptionSheetOpen(true);
      setEditorOpen(false);
    });
  };

  const addOption = (groupId: string) => {
    openTextEditor(t("addOption"), "", (value) => {
      const name = value.trim();
      if (!name) return;
      const id = uniqueOptionId(name, filterOptions[groupId] ?? []);
      const next: FilterOption = {
        id,
        name,
        nameI18n: initI18n(name),
        slug: id,
      };
      setFilterOptions((prev) => ({
        ...prev,
        [groupId]: [...(prev[groupId] ?? []), next],
      }));
      setSelectedOptionId(next.id);
      setEditorOpen(false);
    });
  };

  if (loading) {
    return (
      <Can module="marketplace" action="view" fallback={<p className="text-sm text-muted-foreground">{tCommon("accessDenied")}</p>}>
        <AdminPageHeader title={t("title")} description={t("description")} />
        <div className="min-h-[40vh]" aria-hidden />
      </Can>
    );
  }

  return (
    <Can module="marketplace" action="view" fallback={<p className="text-sm text-muted-foreground">{tCommon("accessDenied")}</p>}>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={isDirty ? "secondary" : "outline"}>
              {isDirty ? tCommon("unsavedChanges") : tCommon("allChangesSaved")}
            </Badge>
            <Button
              onClick={() => void saveAll()}
              className="rounded-full bg-oboya-green text-white hover:bg-oboya-green/90"
              disabled={saving || !isDirty}
            >
              {saving ? tCommon("saving") : t("saveFilters")}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="taxonomy">{t("categories")}</TabsTrigger>
          <TabsTrigger value="brands">{t("brands")}</TabsTrigger>
          <TabsTrigger value="options">{t("productFilters")}</TabsTrigger>
        </TabsList>

        <TabsContent value="taxonomy">
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t("categoryTree")}</span>
                  <Button variant="outline" size="sm" onClick={addCategory}>
                    <Plus className="mr-1 size-3.5" /> {t("addCategory")}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder={t("searchCategory")}
                    value={searchCategory}
                    onChange={(event) => setSearchCategory(event.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={categoryUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("all")}>{tCommon("all")}</Button>
                  <Button size="sm" variant={categoryUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("used")}>{tCommon("used")}</Button>
                  <Button size="sm" variant={categoryUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setCategoryUsageFilter("unused")}>{tCommon("unused")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("name-asc")}>{tCommon("sortAZ")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("name-desc")}>{tCommon("sortZA")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setCategorySort("usage-desc")}>{tCommon("mostUsed")}</Button>
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
                          {pickLocalized(category.name, category.nameI18n, locale)}
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={t("editCategory", {
                              name: pickLocalized(category.name, category.nameI18n, locale),
                            })}
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
                            aria-label={t("removeCategory", {
                              name: pickLocalized(category.name, category.nameI18n, locale),
                            })}
                            onClick={() => {
                              const inUse = categoryUsage[category.id] ?? 0;
                              openDeleteConfirm({
                                title: t("deleteCategory"),
                                description:
                                  inUse > 0
                                    ? t("deleteBlocked", { count: inUse })
                                    : t("deleteConfirm"),
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
                              {pickLocalized(subcategory.name, subcategory.nameI18n, locale)}
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
                <CardTitle>{t("siteReflection")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-oboya-green/10 px-3 py-2 text-sm font-medium">{t("categories")}</div>
                <div className="space-y-2">
                  {categories.slice(0, 8).map((category) => (
                    <p key={`preview-category-${category.id}`} className="text-sm text-oboya-blue-dark">
                      {pickLocalized(category.name, category.nameI18n, locale)}
                    </p>
                  ))}
                </div>
                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase">{t("brands")}</p>
                  {brands.slice(0, 6).map((brand) => (
                    <label key={`preview-brand-${brand.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                      <input type="checkbox" disabled />
                      <BrandLabel brand={brand} locale={locale} />
                    </label>
                  ))}
                </div>
                {filterGroups.map((group) => (
                  <div key={`preview-group-${group.id}`} className="border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase">{groupLabel(group.id)}</p>
                    {(filterOptions[group.id] ?? []).slice(0, 6).map((option) => (
                      <label key={`preview-option-${option.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                        <input type="checkbox" disabled />
                        {pickLocalized(option.name, option.nameI18n, locale)}
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
                  <span>{t("brands")}</span>
                  <Button variant="outline" size="sm" onClick={addBrand}>
                    <Plus className="mr-1 size-3.5" /> {t("addBrand")}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder={t("searchBrand")} value={searchBrand} onChange={(event) => setSearchBrand(event.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={brandUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("all")}>{tCommon("all")}</Button>
                  <Button size="sm" variant={brandUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("used")}>{tCommon("used")}</Button>
                  <Button size="sm" variant={brandUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setBrandUsageFilter("unused")}>{tCommon("unused")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("name-asc")}>{tCommon("sortAZ")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("name-desc")}>{tCommon("sortZA")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setBrandSort("usage-desc")}>{tCommon("mostUsed")}</Button>
                </div>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {filteredBrands.map((brand) => (
                    <div key={brand.id} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${selectedBrandId === brand.id ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}>
                      <button type="button" className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-oboya-blue-dark hover:underline" onClick={() => setSelectedBrandId(brand.id)}>
                        <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                        <BrandLabel brand={brand} locale={locale} />
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={t("editBrand", {
                            name: pickLocalized(brand.name, brand.nameI18n, locale),
                          })}
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
                          aria-label={t("removeBrand", {
                            name: pickLocalized(brand.name, brand.nameI18n, locale),
                          })}
                          onClick={() => {
                            const used = brandUsage[brand.id] ?? 0;
                            openDeleteConfirm({
                              title: t("deleteBrand"),
                              description:
                                used > 0
                                  ? t("deleteBlocked", { count: used })
                                  : t("deleteConfirm"),
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
                <CardTitle>{t("siteReflection")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-semibold uppercase text-oboya-blue-dark">{t("brands")}</p>
                {brands.slice(0, 12).map((brand) => (
                  <label key={`brands-preview-${brand.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                    <input type="checkbox" disabled />
                    <BrandLabel brand={brand} locale={locale} />
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="options">
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t("productFilters")}</span>
                  <Button variant="outline" size="sm" onClick={addFilterGroup}>
                    <Plus className="mr-1 size-3.5" /> {t("addGroup")}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filterGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`rounded-lg border px-3 py-2 ${selectedGroup === group.id ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-oboya-blue-dark hover:underline"
                        onClick={() => {
                          setSelectedGroup(group.id);
                          setSelectedOptionId(filterOptions[group.id]?.[0]?.id ?? null);
                        }}
                      >
                        {groupLabel(group.id)}
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={t("editGroup", { name: groupLabel(group.id) })}
                          onClick={() => {
                            setSelectedGroup(group.id);
                            setSelectedOptionId(filterOptions[group.id]?.[0]?.id ?? null);
                            setOptionSheetOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          aria-label={t("removeGroup", { name: groupLabel(group.id) })}
                          onClick={() => {
                            const inUse = groupUsage[group.id] ?? 0;
                            openDeleteConfirm({
                              title: t("deleteGroup"),
                              description:
                                inUse > 0
                                  ? t("deleteBlocked", { count: inUse })
                                  : t("deleteConfirm"),
                              blocked: inUse > 0,
                              onConfirm: () => {
                                setFilterGroups((prev) => {
                                  const remaining = prev.filter((item) => item.id !== group.id);
                                  if (selectedGroup === group.id) {
                                    const nextGroupId = remaining[0]?.id ?? "";
                                    setSelectedGroup(nextGroupId);
                                    setSelectedOptionId(
                                      nextGroupId
                                        ? filterOptions[nextGroupId]?.[0]?.id ?? null
                                        : null
                                    );
                                  }
                                  return remaining;
                                });
                                setFilterOptions((prev) => {
                                  const next = { ...prev };
                                  delete next[group.id];
                                  return next;
                                });
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
                      {(filterOptions[group.id] ?? []).slice(0, 4).map((option) => (
                        <button
                          key={`group-preview-${group.id}-${option.id}`}
                          type="button"
                          className="block text-left text-xs text-muted-foreground hover:text-oboya-blue-dark"
                          onClick={() => {
                            setSelectedGroup(group.id);
                            setSelectedOptionId(option.id);
                          }}
                        >
                          {pickLocalized(option.name, option.nameI18n, locale)}
                        </button>
                      ))}
                      {(filterOptions[group.id]?.length ?? 0) > 4 && (
                        <p className="text-[11px] text-muted-foreground">
                          {t("moreOptions", { count: (filterOptions[group.id]?.length ?? 0) - 4 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {t("optionDetailsDesc")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("siteReflection")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {filterGroups.map((group) => (
                  <div key={`options-preview-${group.id}`} className="border-b border-border/60 pb-3 last:border-b-0">
                    <p className="mb-2 text-xs font-semibold uppercase text-oboya-blue-dark">{groupLabel(group.id)}</p>
                    {(filterOptions[group.id] ?? []).slice(0, 8).map((option) => (
                      <label key={`options-preview-item-${option.id}`} className="mb-1 flex items-center gap-2 text-sm text-oboya-blue-dark">
                        <input type="checkbox" disabled />
                        {pickLocalized(option.name, option.nameI18n, locale)}
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
            <SheetTitle>{t("taxonomyDetails")}</SheetTitle>
            <SheetDescription>{t("taxonomyDetailsDesc")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            {!selectedCategory && <p className="text-sm text-muted-foreground">{t("selectCategoryFirst")}</p>}
            {selectedCategory && (
              <>
                <div className="rounded-lg border border-border/60 p-3">
                  <Label>{t("category")}</Label>
                  <ShopLocalizedNameFields
                    className="mt-2"
                    name={selectedCategory.name}
                    nameI18n={selectedCategory.nameI18n}
                    onNameChange={(nextName) =>
                      setCategories((prev) =>
                        prev.map((category) =>
                          category.id === selectedCategory.id
                            ? { ...category, name: nextName }
                            : category
                        )
                      )
                    }
                    onI18nChange={(loc, value) =>
                      setCategories((prev) =>
                        prev.map((category) =>
                          category.id === selectedCategory.id
                            ? {
                                ...category,
                                nameI18n: {
                                  ...initI18n(category.name, category.nameI18n),
                                  [loc]: value,
                                },
                              }
                            : category
                        )
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("subcategories")}</Label>
                    <Button size="sm" variant="outline" onClick={() => addSubcategory(selectedCategory.id)}>
                      <Plus className="mr-1 size-3.5" /> {t("addSubcategory")}
                    </Button>
                  </div>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className={`space-y-2 rounded-lg border p-2 ${
                        selectedSubcategoryId === subcategory.id
                          ? "border-oboya-green/60 bg-oboya-green/5"
                          : "border-border/60"
                      }`}
                      onFocus={() => setSelectedSubcategoryId(subcategory.id)}
                    >
                      <ShopLocalizedNameFields
                        name={subcategory.name}
                        nameI18n={subcategory.nameI18n}
                        onNameChange={(nextName) =>
                          setCategories((prev) =>
                            prev.map((category) =>
                              category.id === selectedCategory.id
                                ? {
                                    ...category,
                                    subcategories: category.subcategories.map((item) =>
                                      item.id === subcategory.id
                                        ? { ...item, name: nextName }
                                        : item
                                    ),
                                  }
                                : category
                            )
                          )
                        }
                        onI18nChange={(loc, value) =>
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
                                              [loc]: value,
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>{tCommon("close")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={brandSheetOpen} onOpenChange={setBrandSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("brandDetails")}</SheetTitle>
            <SheetDescription>{t("brandDetailsDesc")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            {!selectedBrand && <p className="text-sm text-muted-foreground">{t("selectBrandFirst")}</p>}
            {selectedBrand && (
              <div className="space-y-3 rounded-lg border border-border/60 p-3">
                <ShopLocalizedNameFields
                  name={selectedBrand.name}
                  nameI18n={selectedBrand.nameI18n}
                  onNameChange={(nextName) =>
                    setBrands((prev) =>
                      prev.map((brand) =>
                        brand.id === selectedBrand.id
                          ? { ...brand, name: nextName }
                          : brand
                      )
                    )
                  }
                  onI18nChange={(loc, value) =>
                    setBrands((prev) =>
                      prev.map((brand) =>
                        brand.id === selectedBrand.id
                          ? {
                              ...brand,
                              nameI18n: {
                                ...initI18n(brand.name, brand.nameI18n),
                                [loc]: value,
                              },
                            }
                          : brand
                      )
                    )
                  }
                />
                <div className="space-y-1.5">
                  <Label htmlFor="brand-flag">{t("countryFlag")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("countryFlagHint")}
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
                    <option value="">{t("noFlag")}</option>
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
                      {t("shopPreview")}
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("usedByProducts", { count: brandUsage[selectedBrand.id] ?? 0 })}
                </p>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setBrandSheetOpen(false)}>{tCommon("close")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={optionSheetOpen} onOpenChange={setOptionSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("optionDetails")}</SheetTitle>
            <SheetDescription>{t("optionDetailsDesc")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto px-4">
            {selectedGroupEntry && (
              <div className="rounded-lg border border-border/60 p-3">
                <Label>{t("editGroupName")}</Label>
                <ShopLocalizedNameFields
                  className="mt-2"
                  name={selectedGroupEntry.name}
                  nameI18n={selectedGroupEntry.nameI18n}
                  onNameChange={(nextName) =>
                    setFilterGroups((prev) =>
                      prev.map((group) =>
                        group.id === selectedGroupEntry.id
                          ? { ...group, name: nextName }
                          : group
                      )
                    )
                  }
                  onI18nChange={(loc, value) =>
                    setFilterGroups((prev) =>
                      prev.map((group) =>
                        group.id === selectedGroupEntry.id
                          ? {
                              ...group,
                              nameI18n: {
                                ...initFilterGroupI18n(group.name, group.nameI18n),
                                [loc]: value,
                              },
                            }
                          : group
                      )
                    )
                  }
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("usedByProducts", { count: groupUsage[selectedGroupEntry.id] ?? 0 })}
                </p>
              </div>
            )}
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                value={searchOption}
                onChange={(event) => setSearchOption(event.target.value)}
                placeholder={t("searchOption")}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={optionUsageFilter === "all" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("all")}>{tCommon("all")}</Button>
              <Button size="sm" variant={optionUsageFilter === "used" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("used")}>{tCommon("used")}</Button>
              <Button size="sm" variant={optionUsageFilter === "unused" ? "secondary" : "outline"} onClick={() => setOptionUsageFilter("unused")}>{tCommon("unused")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("name-asc")}>{tCommon("sortAZ")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("name-desc")}>{tCommon("sortZA")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOptionSort("usage-desc")}>{tCommon("mostUsed")}</Button>
            </div>

            <div className="space-y-2">
              {filteredOptions.map((option) => (
                <div key={option.id} className={`rounded-lg border px-3 py-2 ${selectedOptionId === option.id ? "border-oboya-green/60 bg-oboya-green/5" : "border-border/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" className="text-left text-sm hover:underline" onClick={() => setSelectedOptionId(option.id)}>
                      {pickLocalized(option.name, option.nameI18n, locale)}
                    </button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={t("removeOption", {
                        name: pickLocalized(option.name, option.nameI18n, locale),
                      })}
                      onClick={() => {
                        const used = optionUsage[selectedGroup]?.[option.id] ?? 0;
                        openDeleteConfirm({
                          title: t("deleteOption"),
                          description:
                            used > 0
                              ? t("deleteOptionUsed", { count: used })
                              : t("deleteOptionConfirm"),
                          blocked: used > 0,
                          onConfirm: () => {
                            setFilterOptions((prev) => ({
                              ...prev,
                              [selectedGroup]: (prev[selectedGroup] ?? []).filter((item) => item.id !== option.id),
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
                    <ShopLocalizedNameFields
                      className="mt-3"
                      name={option.name}
                      nameI18n={option.nameI18n}
                      onNameChange={(nextName) =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          [selectedGroup]: (prev[selectedGroup] ?? []).map((item) =>
                            item.id === option.id
                              ? { ...item, name: nextName }
                              : item
                          ),
                        }))
                      }
                      onI18nChange={(loc, value) =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          [selectedGroup]: (prev[selectedGroup] ?? []).map((item) =>
                            item.id === option.id
                              ? {
                                  ...item,
                                  nameI18n: {
                                    ...initI18n(item.name, item.nameI18n),
                                    [loc]: value,
                                  },
                                }
                              : item
                          ),
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => addOption(selectedGroup)}>
              <Plus className="mr-1 size-3.5" /> {t("addOption")}
            </Button>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOptionSheetOpen(false)}>{tCommon("close")}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editorLabel}</DialogTitle>
            <DialogDescription>{t("editorHint")}</DialogDescription>
          </DialogHeader>
          <Input value={editorValue} onChange={(event) => setEditorValue(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={() => editorAction?.(editorValue)}>{tCommon("save")}</Button>
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
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>{tCommon("cancel")}</Button>
            <Button variant={confirmBlocked ? "outline" : "destructive"} disabled={confirmBlocked} onClick={() => confirmAction?.()}>
              {confirmBlocked ? tCommon("cannotDelete") : tCommon("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Can>
  );
}
