"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  action: () => Promise<void>;
  confirmText?: string;
  label?: string;
};

export function DeleteButton({
  action,
  confirmText = "Yakin ingin menghapus?",
  label,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm(confirmText)) return;
        startTransition(async () => {
          try {
            await action();
            toast.success("Berhasil dihapus");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Gagal menghapus",
            );
          }
        });
      }}
    >
      <Trash2 className="mr-1 h-4 w-4" />
      {label ?? "Hapus"}
    </Button>
  );
}
