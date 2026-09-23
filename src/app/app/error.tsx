"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-5 pt-16 pb-10 flex flex-col items-center text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <h1 className="serif text-[19px] mb-2">Ada yang salah</h1>
      <p className="text-sm text-text-dim mb-6 max-w-[280px]">
        Gagal memuat data. Cek koneksi internetmu lalu coba lagi.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
