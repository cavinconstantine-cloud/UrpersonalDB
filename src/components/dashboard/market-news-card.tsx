import { SectionCard } from "@/components/ui/section-card";

export interface MarketNewsItem {
  id: string;
  headline: string;
  summary: string;
  sources: { title: string; url: string; publisher?: string }[];
  publishedAt: string;
}

export function MarketNewsCard({ news }: { news: MarketNewsItem[] }) {
  if (news.length === 0) return null;

  return (
    <SectionCard title="🌐 Berita Pasar">
      <div className="pb-2 space-y-3.5">
        {news.map((item) => (
          <div key={item.id} className="pb-3 border-b border-hairline last:border-b-0 last:pb-1">
            <div className="text-sm font-medium mb-1 leading-snug">{item.headline}</div>
            <p className="text-[13px] text-text-dim leading-relaxed mb-1.5">{item.summary}</p>
            {item.sources.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {item.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[11px] text-brand-strong truncate max-w-[220px]"
                  >
                    {s.publisher || s.title} ↗
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="text-[11px] text-text-dim pb-1">Dianalisa oleh AI, dikutip dari sumber tepercaya.</div>
      </div>
    </SectionCard>
  );
}
