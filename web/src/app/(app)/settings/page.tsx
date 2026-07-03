"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUpdateSettings } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { UserSettings } from "@/types";

const LANGUAGES: { value: UserSettings["language"]; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
];

const QUALITIES: { value: UserSettings["audioQuality"]; label: string; hint: string }[] = [
  { value: "data-saver", label: "Data saver", hint: "~24 kbit/s" },
  { value: "normal", label: "Normal", hint: "~96 kbit/s" },
  { value: "high", label: "High", hint: "~320 kbit/s" },
  { value: "lossless", label: "Lossless", hint: "FLAC-grade" },
];

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-7">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-6">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-subtle">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateSettings();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-3">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  const settings = user.settings;
  const patch = (value: Partial<UserSettings>) => update.mutate(value);

  return (
    <div className="mx-auto max-w-2xl px-3 pb-4">
      <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Changes save automatically.</p>

      <div className="mt-6 space-y-5">
        <Section title="Playback" description="Streaming quality and behavior.">
          <div role="radiogroup" aria-label="Audio quality" className="grid gap-2 sm:grid-cols-2">
            {QUALITIES.map((quality) => (
              <button
                key={quality.value}
                role="radio"
                aria-checked={settings.audioQuality === quality.value}
                onClick={() => patch({ audioQuality: quality.value })}
                className={cn(
                  "focus-ring flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                  settings.audioQuality === quality.value
                    ? "border-primary/50 bg-primary/12"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span className="text-sm font-medium">{quality.label}</span>
                <span className="text-xs text-subtle">{quality.hint}</span>
              </button>
            ))}
          </div>
          <ToggleRow
            label="Autoplay"
            hint="Keep the music going with similar songs when your queue ends"
            checked={settings.autoplay}
            onChange={(autoplay) => patch({ autoplay })}
          />
        </Section>

        <Section title="Language" description="Interface language for DoReMi.">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Language">
            {LANGUAGES.map((language) => (
              <button
                key={language.value}
                role="radio"
                aria-checked={settings.language === language.value}
                onClick={() => patch({ language: language.value })}
                className={cn(
                  "focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  settings.language === language.value
                    ? "border-primary/50 bg-primary/12 text-primary-soft"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {language.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-subtle">
            Full translations are on the roadmap — your preference is saved for when they land.
          </p>
        </Section>

        <Section title="Notifications" description="What we're allowed to ping you about.">
          <ToggleRow
            label="New music from artists you follow"
            hint="Release-day alerts for your favorite artists"
            checked={settings.notifyNewMusic}
            onChange={(notifyNewMusic) => patch({ notifyNewMusic })}
          />
          <ToggleRow
            label="Product news"
            hint="Occasional updates about new DoReMi features"
            checked={settings.notifyProduct}
            onChange={(notifyProduct) => patch({ notifyProduct })}
          />
        </Section>

        <Section title="Privacy" description="Control what others can see.">
          <ToggleRow
            label="Show my listening activity"
            hint="Let followers see what you're playing"
            checked={settings.showActivity}
            onChange={(showActivity) => patch({ showActivity })}
          />
          <ToggleRow
            label="Personalized recommendations"
            hint="Use my listening history to tune Home and Search"
            checked={settings.personalizedRecs}
            onChange={(personalizedRecs) => patch({ personalizedRecs })}
          />
        </Section>
      </div>
    </div>
  );
}
