"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { updateProfileName } from "@/app/app/settings/actions";
import { useLanguage } from "./language-provider";

interface SettingsFormProps {
  initialName: string;
}

export function SettingsForm({ initialName }: SettingsFormProps) {
  const { dict } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    startTransition(async () => {
      try {
        await updateProfileName(name);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      }
    });
  }

  return (
    <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
      <div className="serif text-[15px] mb-3">{dict.settings.profile}</div>
      <TextField label={dict.settings.nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="sm" onClick={saveProfile} disabled={isPending}>
        {isPending ? <Spinner size={14} /> : saved ? dict.settings.saved : dict.settings.saveName}
      </Button>
    </div>
  );
}
