"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Play, Pause, RotateCcw, Check, Timer } from "lucide-react";
import { useDeviceValue } from "./useCompanion";
type Session = {
  id: string;
  minutes: number;
  endAt: number | null;
  remaining: number;
};
export default function FocusTimer({
  userKey,
  initialNow,
  onFinish,
  busy,
}: {
  userKey: string;
  initialNow: number;
  onFinish: (id: string, minutes: number) => Promise<boolean>;
  busy: boolean;
}) {
  const t = useTranslations("Companion");
  const [raw, write] = useDeviceValue(`rafeeq.focus.${userKey}`, "null", true);
  let session: Session | null = null;
  try {
    const value = JSON.parse(raw);
    if (
      value &&
      typeof value.id === "string" &&
      [10, 25, 50].includes(value.minutes) &&
      Number.isFinite(value.remaining) &&
      (value.endAt === null || Number.isFinite(value.endAt))
    )
      session = value;
  } catch {}
  const [minutes, setMinutes] = useState(25);
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const remaining = session
    ? Math.max(
        0,
        session.endAt === null ? session.remaining : session.endAt - now,
      )
    : minutes * 60000;
  const seconds = Math.ceil(remaining / 1000);
  const display = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  function start() {
    const current = Date.now();
    write(
      JSON.stringify(
        session
          ? { ...session, endAt: current + session.remaining }
          : {
              id: crypto.randomUUID(),
              minutes,
              endAt: current + minutes * 60000,
              remaining: minutes * 60000,
            },
      ),
    );
    setNow(current);
  }
  function pause() {
    if (session)
      write(
        JSON.stringify({
          ...session,
          remaining: Math.max(0, (session.endAt ?? Date.now()) - Date.now()),
          endAt: null,
        }),
      );
  }
  async function finish() {
    if (
      session &&
      remaining === 0 &&
      (await onFinish(session.id, session.minutes))
    )
      write("null");
  }
  return (
    <section className="companion-focus rounded-[1.75rem] bg-[#102f2d] p-6 text-white">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-200">
        <Timer size={17} aria-hidden="true" />
        {t("focusTitle")}
      </p>
      <h2 className="text-xl font-bold">{t("focusHeadline")}</h2>
      <p className="mt-2 text-xs leading-6 text-white/65">{t("focusHint")}</p>
      <p
        role="timer"
        aria-label={t("focusRemaining")}
        dir="ltr"
        className="py-7 text-center font-mono text-6xl font-medium tracking-tight"
      >
        {display}
      </p>
      {!session && (
        <div className="mb-5 flex justify-center gap-2">
          {[10, 25, 50].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMinutes(value)}
              aria-pressed={minutes === value}
              className={`rounded-full px-4 py-2 text-xs font-bold ${minutes === value ? "bg-emerald-200 text-[#102f2d]" : "bg-white/10 text-white"}`}
            >
              {t("minutes", { count: value })}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {session && remaining === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={finish}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-200 p-3 text-sm font-bold text-emerald-950"
          >
            <Check size={18} aria-hidden="true" />
            {t("saveFocus")}
          </button>
        ) : (
          <button
            type="button"
            onClick={session?.endAt ? pause : start}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white p-3 text-sm font-bold text-[#102f2d]"
          >
            {session?.endAt ? (
              <Pause size={17} aria-hidden="true" />
            ) : (
              <Play size={17} aria-hidden="true" />
            )}
            {t(session?.endAt ? "pause" : "startFocus")}
          </button>
        )}
        {session && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("resetFocusConfirm"))) write("null");
            }}
            aria-label={t("resetFocus")}
            className="rounded-xl border border-white/20 px-4"
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
