"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function AccountStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const [error, setError] = useState("");

  function next() {
    if (!draft.name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    update({ step: "profileType" });
  }

  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Siapa nama kamu?</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">
        Dipakai untuk menyapa kamu di dashboard — tidak ditampilkan ke siapa pun.
      </p>
      <TextField
        label="Nama"
        value={draft.name}
        error={error}
        onChange={(e) => {
          update({ name: e.target.value });
          if (error) setError("");
        }}
        placeholder="Nama kamu"
        autoFocus
      />
      <Button fullWidth onClick={next} className="mt-2">
        Lanjut
      </Button>
    </div>
  );
}
