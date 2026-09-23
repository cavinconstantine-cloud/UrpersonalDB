export default function Loading() {
  return (
    <div className="px-5 pt-6 space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-bg-raised border border-hairline animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
