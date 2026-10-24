"use client";
import { useTranslations } from "next-intl";
import { Mail, LockKeyhole, Plus, Trash2, CalendarHeart } from "lucide-react";
import type { CompanionData } from "@/lib/companion/model";
import { saveClass } from "./fields";
export default function CapsulePanel({
  capsules,
  today,
  onAdd,
  onRemove,
  busy,
}: {
  capsules: CompanionData["capsules"];
  today: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  busy: boolean;
}) {
  const t = useTranslations("Companion");
  return (
    <section>
      <div className="companion-paper mb-6 flex flex-col justify-between gap-5 bg-[#eee9f5] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="companion-eyebrow">
            <CalendarHeart size={16} aria-hidden="true" />
            {t("capsuleEyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{t("capsuleTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {t("capsuleHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={capsules.length >= 40}
          className={`${saveClass} shrink-0`}
        >
          <Plus size={17} aria-hidden="true" />
          {t("writeCapsule")}
        </button>
      </div>
      {capsules.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...capsules]
            .sort((a, b) => a.opensOn.localeCompare(b.opensOn))
            .map((capsule) => {
              const ready = capsule.opensOn <= today;
              const days = Math.max(
                0,
                Math.round(
                  (Date.parse(`${capsule.opensOn}T12:00:00Z`) -
                    Date.parse(`${today}T12:00:00Z`)) /
                    86400000,
                ),
              );
              return (
                <article key={capsule.id} className="companion-paper p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span
                      className={`rounded-2xl p-3 ${ready ? "bg-amber-50 text-amber-700" : "bg-lavender text-plum"}`}
                    >
                      {ready ? (
                        <Mail size={24} aria-hidden="true" />
                      ) : (
                        <LockKeyhole size={23} aria-hidden="true" />
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t("deleteCapsuleConfirm")))
                          onRemove(capsule.id);
                      }}
                      aria-label={t("deleteNamed", { name: capsule.title })}
                      className="rounded-lg p-2 text-muted hover:text-red-700"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <h3 dir="auto" className="break-words text-lg font-bold">
                    {capsule.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted">
                    {t("opensOn", { date: capsule.opensOn })}
                  </p>
                  {ready ? (
                    <details className="mt-5 rounded-xl bg-[#faf8f1] p-4">
                      <summary className="cursor-pointer text-sm font-bold text-[#375342]">
                        {t("openCapsule")}
                      </summary>
                      <p
                        dir="auto"
                        className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-ink"
                      >
                        {capsule.body}
                      </p>
                    </details>
                  ) : (
                    <p className="mt-5 rounded-xl bg-canvas p-4 text-sm font-bold text-muted">
                      {t("daysUntil", { count: days })}
                    </p>
                  )}
                </article>
              );
            })}
        </div>
      ) : (
        <div className="companion-paper p-8 text-center">
          <Mail
            size={38}
            aria-hidden="true"
            className="mx-auto mb-4 text-plum"
          />
          <p className="text-sm leading-8 text-muted">{t("noCapsules")}</p>
        </div>
      )}
    </section>
  );
}
