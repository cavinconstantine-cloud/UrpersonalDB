export default function Loading() {
  return (
    <div className="px-5 pt-6 space-y-4 max-w-[560px] mx-auto">
      <div className="h-1 rounded-full bg-hairline mb-6 animate-pulse" />
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-16 rounded-2xl bg-bg-raised border border-hairline animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
