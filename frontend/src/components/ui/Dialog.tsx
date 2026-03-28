"use client";

import { Dialog as HD, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const max = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-lg";
  return (
    <HD open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" transition />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={clsx(
            max,
            "w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl",
            "data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in",
            className,
          )}
        >
          {title && (
            <DialogTitle className="text-lg font-semibold text-slate-900 mb-4">{title}</DialogTitle>
          )}
          {children}
        </DialogPanel>
      </div>
    </HD>
  );
}
