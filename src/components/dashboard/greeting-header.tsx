import { capNameOrKamu } from "@/lib/finance/format";

export function GreetingHeader({ name }: { name: string | null | undefined }) {
  return (
    <div className="mx-5 mt-4 text-sm text-text-dim flex items-center gap-2">
      👋 Hai, {capNameOrKamu(name)}
    </div>
  );
}
