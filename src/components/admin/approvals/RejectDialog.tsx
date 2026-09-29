"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RejectDialog({
  open,
  onOpenChange,
  requireComment,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requireComment: boolean;
  busy?: boolean;
  onConfirm: (comment: string) => void;
}) {
  const t = useTranslations("admin.approvals");
  const tCommon = useTranslations("admin.common");
  const [comment, setComment] = useState("");
  const missing = requireComment && comment.trim() === "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setComment("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reject.title")}</DialogTitle>
          <DialogDescription>{t("reject.description")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reject.placeholder")}
          rows={4}
        />
        {missing ? (
          <p className="text-xs text-oboya-orange">{t("reject.commentRequired")}</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            className="rounded-full bg-oboya-orange text-white hover:bg-oboya-orange/90"
            disabled={missing || busy}
            onClick={() => {
              onConfirm(comment.trim());
              setComment("");
            }}
          >
            {t("actions.confirmReject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
