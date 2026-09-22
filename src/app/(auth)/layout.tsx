import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col bg-bg">
      <div className="px-6 py-5">
        <Link href="/" className="serif text-[16px] text-brand-strong">
          Uangku
        </Link>
      </div>
      <div className="flex-1 flex items-start sm:items-center justify-center px-5 pb-16">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
