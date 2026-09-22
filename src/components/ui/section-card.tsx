import type { ReactNode } from "react";

export function SectionCard({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-5 mb-4.5 bg-bg-raised border border-hairline rounded-[22px] p-[18px] pb-1.5 shadow-[var(--shadow-card)]">
      <div className="flex justify-between items-baseline pb-3 mb-1">
        <div className="serif text-[17px] flex items-center gap-2">{title}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
