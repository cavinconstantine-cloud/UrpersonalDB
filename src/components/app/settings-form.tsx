"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateProfileName } from "@/app/app/settings/actions";
import { useLanguage } from "./language-provider";

interface SettingsFormProps {
  initialName: string;
}

export function SettingsForm({ initialName }: SettingsFormProps) {
  const { dict } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  function saveProfile() {
    startTransition(async () => {
      await updateProfileName(name);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
      <div className="serif text-[15px] mb-3">{dict.settings.profile}</div>
      <TextField label={dict.settings.nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="sm" onClick={saveProfile} disabled={isPending}>
        {saved ? dict.settings.saved : dict.settings.saveName}
      </Button>
    </div>
  );
}
