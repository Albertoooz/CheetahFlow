"use client";

import clsx from "clsx";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm",
        "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        "min-h-[120px] resize-y",
        className,
      )}
      {...props}
    />
  );
}
