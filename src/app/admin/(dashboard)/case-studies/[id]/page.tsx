"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/editors/RichTextEditor";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getCaseStudyById,
  saveCaseStudy,
  type CaseStudyRegion,
  type CmsCaseStudy,
} from "@/lib/cms/repositories/case-studies-repository";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";

const REGIONS: CaseStudyRegion[] = ["europe", "americas", "asia", "other"];

export default function CaseStudyEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [study, setStudy] = useState<CmsCaseStudy>(() => {
    if (isNew) {
      return {
        id: `case-${Date.now()}`,
        slug: "",
        title: emptyLocalizedString(),
        excerpt: emptyLocalizedString(),
        metric: emptyLocalizedString(),
        challenge: emptyLocalizedString(),
        solution: emptyLocalizedString(),
        results: emptyLocalizedString(),
        industry: "",
        country: "",
        region: "other",
        segment: "",
        coverImage: "",
        images: [],
        gallery: [],
        downloads: [],
        status: "draft",
        seo: { title: emptyLocalizedString(), description: emptyLocalizedString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    const existing = getCaseStudyById(id)!;
    return {
      ...existing,
      metric: existing.metric ?? emptyLocalizedString(),
    };
  });
  const [locale, setLocale] = useState<CmsLocale>("en");

  if (!study) return <p>Case study not found</p>;

  const handleSave = () => {
    saveCaseStudy(study);
    toast.success("Case study saved");
    router.push("/admin/case-studies");
  };

  return (
    <div>
      <AdminPageHeader
        title={isNew ? "New case study" : study.title.en}
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/case-studies"
              className={buttonVariants({ variant: "outline", className: "rounded-full" })}
            >
              Back
            </Link>
            <Button onClick={handleSave} className="rounded-full bg-oboya-green hover:bg-oboya-green/90">
              Save
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <LocaleFieldTabs value={locale} onChange={setLocale}>
              {(loc) => (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input
                      value={study.title[loc]}
                      onChange={(e) =>
                        setStudy({ ...study, title: { ...study.title, [loc]: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Outcome metric (e.g. −18% handling time)</Label>
                    <Input
                      value={study.metric[loc]}
                      onChange={(e) =>
                        setStudy({ ...study, metric: { ...study.metric, [loc]: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Excerpt (listing summary)</Label>
                    <Textarea
                      value={study.excerpt[loc]}
                      onChange={(e) =>
                        setStudy({ ...study, excerpt: { ...study.excerpt, [loc]: e.target.value } })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Challenge</Label>
                    <RichTextEditor
                      value={study.challenge[loc]}
                      onChange={(html) =>
                        setStudy({
                          ...study,
                          challenge: { ...study.challenge, [loc]: html },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Solution</Label>
                    <RichTextEditor
                      value={study.solution[loc]}
                      onChange={(html) =>
                        setStudy({
                          ...study,
                          solution: { ...study.solution, [loc]: html },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Results</Label>
                    <RichTextEditor
                      value={study.results[loc]}
                      onChange={(html) =>
                        setStudy({
                          ...study,
                          results: { ...study.results, [loc]: html },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </LocaleFieldTabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={study.slug} onChange={(e) => setStudy({ ...study, slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cover image URL</Label>
              <Input
                value={study.coverImage}
                onChange={(e) => setStudy({ ...study, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={study.country} onChange={(e) => setStudy({ ...study, country: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Industry / Segment</Label>
              <Input value={study.industry} onChange={(e) => setStudy({ ...study, industry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <select
                value={study.region}
                onChange={(e) =>
                  setStudy({ ...study, region: e.target.value as CaseStudyRegion })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm capitalize"
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={study.status}
                onChange={(e) => setStudy({ ...study, status: e.target.value as CmsStatus })}
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
