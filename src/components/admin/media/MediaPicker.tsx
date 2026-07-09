"use client";

import { useState } from "react";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MediaPickerProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

const MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=200",
  "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=200",
  "/assets/homepage/company-overview.webp",
];

export function MediaPicker({ value, onChange, label = "Image" }: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {value && (
        <div className="relative h-24 w-40 overflow-hidden rounded-lg border">
          <Image src={value} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(!open)}
      >
        {value ? "Change image" : "Select from library"}
      </Button>
      {open && (
        <div className="flex flex-wrap gap-2 rounded-lg border p-2">
          {MOCK_IMAGES.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => {
                onChange(url);
                setOpen(false);
              }}
              className="relative size-16 overflow-hidden rounded border hover:ring-2 hover:ring-oboya-green"
            >
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
