"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMediaAssets } from "@/lib/cms/repositories/media-repository";

export default function MediaLibraryPage() {
  const [filter, setFilter] = useState("all");
  const assets = getMediaAssets();

  const filtered =
    filter === "all" ? assets : assets.filter((a) => a.type === filter);

  return (
    <div>
      <AdminPageHeader
        title="Media Library"
        description="Centralized storage for images, documents and videos."
        actions={
          <button type="button" className={buttonVariants({ className: "gap-1.5 rounded-full" })}>
            <Upload className="size-4" />
            Upload
          </button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="document">Documents</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {asset.type === "image" ? (
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      {asset.mimeType}
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{asset.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {asset.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {(asset.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
