"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function ToastBar({
  message,
  tone = "error",
  onDismiss,
}: {
  message: ReactNode;
  tone?: "error" | "success" | "info";
  onDismiss?: () => void;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-brand-200 bg-brand-50 text-brand-900",
  };
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm",
        styles[tone],
      )}
    >
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-0.5 hover:bg-black/5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
