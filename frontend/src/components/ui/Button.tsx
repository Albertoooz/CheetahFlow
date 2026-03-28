"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-500 shadow-sm",
  secondary: "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-500",
  ghost: "text-slate-600 hover:bg-slate-100",
} as const;

export function Button({
  variant = "primary",
  className,
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: "sm" | "md";
}) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50",
        variants[variant],
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        className,
      )}
      {...props}
    />
  );
}
