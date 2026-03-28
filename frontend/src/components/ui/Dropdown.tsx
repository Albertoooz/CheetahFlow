"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Dropdown({
  label,
  items,
  align = "right",
}: {
  label: ReactNode;
  items: { key: string; label: string; danger?: boolean; onClick: () => void }[];
  align?: "left" | "right";
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
        {label}
      </MenuButton>
      <MenuItems
        transition
        anchor={align === "right" ? "bottom end" : "bottom start"}
        className={clsx(
          "z-50 mt-1 w-44 origin-top rounded-xl border border-slate-200 bg-white py-1 shadow-lg",
          "data-closed:scale-95 data-closed:opacity-0",
        )}
      >
        {items.map((item) => (
          <MenuItem key={item.key}>
            {({ focus }) => (
              <button
                type="button"
                onClick={item.onClick}
                className={clsx(
                  "flex w-full px-3 py-2 text-left text-sm",
                  focus && "bg-slate-50",
                  item.danger ? "text-red-600" : "text-slate-700",
                )}
              >
                {item.label}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
