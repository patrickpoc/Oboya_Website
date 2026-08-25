"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { RichTextEditor } from "@/components/admin/editors/RichTextEditor";
import { LocaleFieldTabs, emptyLocalizedString } from "@/components/admin/forms/LocaleFieldTabs";
import { ImageField } from "@/components/admin/media/ImageField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getCaseStudyById,
  type CaseStudyRegion,
  type CmsCaseStudy,
} from "@/lib/cms/repositories/case-studies-repository";
import type { CmsLocale, CmsStatus } from "@/lib/cms/types";

const REGIONS: CaseStudyRegion[] = ["europe", "americas", "asia", "other"];

function emptyStudy(): CmsCaseStudy {
  return {
    id: `case-${Date.now()}`,
    slug: "",
    title: emptyLocalizedString(),
    excerpt: emptyLocalizedString(),
    metric: emptyLocalizedString(),
    challenge: emptyLocalizedString(),
    solution: emptyLocalizedString(),
    implementation: emptyLocalizedString(),
    results: emptyLocalizedString(),
    client: "",
    timeline: emptyLocalizedString(),
    industry: "",
    country: "",
    region: "other",
    segment: "",
    coverImage: "",
    images: ["", ""],
    gallery: [],
    downloads: [],
    testimonial: {
      quote: emptyLocalizedString(),
      author: "",
      company: "",
    },
    status: "draft",
    seo: { title: emptyLocalizedString(), description: emptyLocalizedString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function CaseStudyEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [study, setStudy] = useState<CmsCaseStudy>(() => {
    if (isNew) return emptyStudy();
    const existing = getCaseStudyById(id)!;
    return {
      ...existing,
      metric: existing.metric ?? emptyLocalizedString(),
      implementation: existing.implementation ?? emptyLocalizedString(),
      timeline: existing.timeline ?? emptyLocalizedString(),
      client: existing.client ?? "",
      images: existing.images?.length ? existing.images : ["", ""],
      testimonial: existing.testimonial ?? {
        quote: emptyLocalizedString(),
        author: "",
        company: "",
      },
    };
  });
  const [locale, setLocale] = useState<CmsLocale>("en");

  if (!study) return <p>Case study not found</p>;

  const handleSave = async () => {
    try {
      const response = await fetch("/api/cms/case-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(study),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to save case study");
      }
      toast.success("Case study saved — live site will update shortly");
      router.push("/admin/case-studies");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save case study"
      );
    }
  };

  const setImageAt = (index: number, url: string) => {
    const next = [...study.images];
    while (next.length <= index) next.push("");
    next[index] = url;
    setStudy({ ...study, images: next });
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
            <Button
              onClick={() => void handleSave()}
              className="rounded-full bg-oboya-green hover:bg-oboya-green/90"
            >
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
                    <Label>Excerpt (listing / hero intro)</Label>
                    <Textarea
                      value={study.excerpt[loc]}
                      onChange={(e) =>
                        setStudy({ ...study, excerpt: { ...study.excerpt, [loc]: e.target.value } })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timeline</Label>
                    <Input
                      value={study.timeline[loc]}
                      onChange={(e) =>
                        setStudy({
                          ...study,
                          timeline: { ...study.timeline, [loc]: e.target.value },
                        })
                      }
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
                    <Label>Implementation</Label>
                    <RichTextEditor
                      value={study.implementation[loc]}
                      onChange={(html) =>
                        setStudy({
                          ...study,
                          implementation: { ...study.implementation, [loc]: html },
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
                  <div className="space-y-1.5">
                    <Label>Client perspective quote</Label>
                    <Textarea
                      value={study.testimonial.quote[loc]}
                      onChange={(e) =>
                        setStudy({
                          ...study,
                          testimonial: {
                            ...study.testimonial,
                            quote: {
                              ...study.testimonial.quote,
                              [loc]: e.target.value,
                            },
                          },
                        })
                      }
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </LocaleFieldTabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={study.slug}
                  onChange={(e) => setStudy({ ...study, slug: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Input
                  value={study.client}
                  onChange={(e) => setStudy({ ...study, client: e.target.value })}
                />
              </div>
              <ImageField
                label="Cover image"
                value={study.coverImage}
                onChange={(url) => setStudy({ ...study, coverImage: url })}
                optional
              />
              <ImageField
                label="Story image 1 (Challenge / Solution)"
                value={study.images[0] ?? ""}
                onChange={(url) => setImageAt(0, url)}
                optional
              />
              <ImageField
                label="Story image 2 (Implementation / Results)"
                value={study.images[1] ?? ""}
                onChange={(url) => setImageAt(1, url)}
                optional
              />
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={study.country}
                  onChange={(e) => setStudy({ ...study, country: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Industry / Segment</Label>
                <Input
                  value={study.industry}
                  onChange={(e) => setStudy({ ...study, industry: e.target.value })}
                />
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
                  onChange={(e) =>
                    setStudy({ ...study, status: e.target.value as CmsStatus })
                  }
                  className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testimonial attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Author name</Label>
                <Input
                  value={study.testimonial.author}
                  onChange={(e) =>
                    setStudy({
                      ...study,
                      testimonial: { ...study.testimonial, author: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={study.testimonial.company}
                  onChange={(e) =>
                    setStudy({
                      ...study,
                      testimonial: { ...study.testimonial, company: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
