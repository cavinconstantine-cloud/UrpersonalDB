"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PanduanItem {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  summary: string;
  body: string[];
}

export function PanduanAccordion({ items, defaultOpenId }: { items: PanduanItem[]; defaultOpenId?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            id={item.id}
            className="bg-bg-raised border border-hairline rounded-[18px] overflow-hidden shadow-[var(--shadow-card)]"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-[17px] shrink-0">
                {item.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-text">{item.title}</span>
                  {item.badge && (
                    <span className="text-[8.5px] font-bold tracking-wide text-warning bg-warning/14 border border-warning/35 rounded-full px-1.5 py-0.5 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="block text-[11.5px] text-text-muted mt-0.5 truncate">{item.summary}</span>
              </span>
              <ChevronDown size={17} className={cn("text-text-muted shrink-0 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div className="px-4 pb-4 pl-[52px] -mt-1 flex flex-col gap-2">
                {item.body.map((p, i) => (
                  <p key={i} className="text-[12.5px] leading-relaxed text-text-dim">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
