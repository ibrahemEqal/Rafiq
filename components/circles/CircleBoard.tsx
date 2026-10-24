"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  BookOpen,
  Repeat2,
  Coffee,
  MapPin,
  Users,
  Plus,
  ArrowUpLeft,
  RefreshCw,
  Check,
  Copy,
  CalendarDays,
  Flag,
} from "lucide-react";
import { mutateCircle, refreshCircles } from "@/lib/actions/circles";
import type { CampusCircle, CircleError } from "@/lib/circles/model";
import { campusInputValue, parseCampusInput } from "@/lib/circles/time";
import Modal from "@/components/companion/Modal";
import { Field, fieldClass, saveClass } from "@/components/companion/fields";
export default function CircleBoard({
  initial,
  signedIn,
  initialNow,
  unavailable,
  initialTarget,
}: {
  initial: CampusCircle[];
  signedIn: boolean;
  initialNow: number;
  unavailable: boolean;
  initialTarget: string | null;
}) {
  const t = useTranslations("Circles");
  const locale = useLocale();
  const [circles, setCircles] = useState(initial);
  const [kind, setKind] = useState("all");
  const [mine, setMine] = useState(false);
  const [target, setTarget] = useState(initialTarget);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CircleError | null>(null);
  const [open, setOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [now, setNow] = useState(initialNow);
  const [copied, setCopied] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  async function reload(nextMine = mine, nextTarget = target) {
    const result = await refreshCircles(nextMine, nextTarget);
    if (result.error) {
      setError(result.error);
      return false;
    }
    setCircles(result.circles);
    return true;
  }
  async function toggleMine(next: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await reload(next, null)) {
        setMine(next);
        setTarget(null);
        globalThis.window.history.replaceState(
          globalThis.window.history.state,
          "",
          globalThis.window.location.pathname,
        );
      }
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  async function act(
    id: string,
    action: "join" | "leave" | "close" | "dismiss",
  ) {
    if (
      busy ||
      (action === "close" && !globalThis.window.confirm(t("closeConfirm")))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const result = await mutateCircle("act", { id, action });
      if (result.error) setError(result.error);
      else await reload();
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const starts = parseCampusInput(String(form.get("starts")));
    if (!starts) {
      setFormError(t("validDate"));
      return;
    }
    setBusy(true);
    setError(null);
    setFormError(null);
    try {
      const result = await mutateCircle("create", {
        title: String(form.get("title")),
        description: String(form.get("description")),
        location: String(form.get("location")),
        kind: String(form.get("kind")),
        starts_at: starts,
        duration: Number(form.get("duration")),
        capacity: Number(form.get("capacity")),
      });
      if (result.error) setError(result.error);
      else {
        setOpen(false);
        setKind("all");
        setMine(false);
        setTarget(result.id);
        globalThis.window.history.replaceState(
          globalThis.window.history.state,
          "",
          `${globalThis.window.location.pathname}?circle=${result.id}`,
        );
        await reload(false, result.id);
      }
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  async function report(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportId || busy) return;
    const reason = String(new FormData(event.currentTarget).get("reason"));
    setBusy(true);
    setError(null);
    try {
      const result = await mutateCircle("report", { id: reportId, reason });
      if (result.error) setError(result.error);
      else {
        setReportId(null);
        setReported(true);
        await reload();
      }
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  }
  async function copy(id: string) {
    const url = `${globalThis.window.location.origin}${globalThis.window.location.pathname}?circle=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setFallback(null);
    } catch {
      setFallback(url);
    }
  }
  const shown = circles.filter(
    (circle) => kind === "all" || circle.kind === kind,
  );
  return (
    <div className="min-h-screen bg-[#f6f5ef] px-4 pb-20 pt-7 sm:px-6 sm:pt-9">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[2rem] bg-[#25372f] p-6 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -end-12 -top-16 size-72 rounded-full border-[50px] border-[#ccdbac]/10"
          />
          <div className="relative max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-2 text-xs font-bold text-[#d5e3c1]">
              <Users size={15} aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/65 sm:text-base">
              {t("intro")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {signedIn ? (
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    setError(null);
                    setFormError(null);
                    setOpen(true);
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#d8edbd] px-5 py-3 text-sm font-bold text-[#213b2c] disabled:opacity-50"
                >
                  <Plus size={18} aria-hidden="true" />
                  {t("hostCircle")}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#d8edbd] px-5 py-3 text-sm font-bold text-[#213b2c]"
                >
                  {t("signInToJoin")}
                  <ArrowUpLeft size={16} aria-hidden="true" />
                </Link>
              )}
              <Link
                href="/companion"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white"
              >
                {t("backToDay")}
              </Link>
            </div>
          </div>
        </header>
        <section className="mt-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <nav aria-label={t("kindFilter")} className="flex flex-wrap gap-2">
            {["all", "study", "exchange", "break"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                aria-pressed={kind === value}
                className={`min-h-11 rounded-full border px-4 py-2 text-xs font-bold ${kind === value ? "border-[#2c4c3b] bg-[#2c4c3b] text-white" : "border-line bg-paper text-muted"}`}
              >
                {t(`kinds.${value}`)}
              </button>
            ))}
          </nav>
          <div className="flex gap-3">
            {signedIn && (
              <button
                type="button"
                disabled={busy}
                onClick={() => toggleMine(!mine)}
                aria-pressed={mine}
                className="rounded-full border border-line bg-paper px-4 py-2 text-xs font-bold text-muted"
              >
                {t(mine ? "showEveryone" : "myCircles")}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              aria-label={t("refresh")}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await reload();
                } catch {
                  setError("failed");
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-full border border-line bg-paper p-3 text-muted"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
        {reported && (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            {t("reportSaved")}
          </p>
        )}
        {target && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-[#eaf0e2] p-4 text-xs font-bold text-emerald-900">
            <p>{t("oneCircle")}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleMine(false)}
              className="underline"
            >
              {t("allCircles")}
            </button>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900"
          >
            {t(`errors.${error}`)}
          </p>
        )}
        {fallback && (
          <label className="mt-5 block text-xs font-bold text-muted">
            {t("copyManually")}
            <input
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              value={fallback}
              dir="ltr"
              className={`${fieldClass} mt-2`}
            />
          </label>
        )}
        {unavailable ? (
          <section className="companion-paper mt-6 p-8 text-center">
            <Users
              size={35}
              aria-hidden="true"
              className="mx-auto mb-4 text-emerald-700"
            />
            <h2 className="text-xl font-bold">{t("activatingTitle")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-8 text-muted">
              {t("activatingHint")}
            </p>
          </section>
        ) : shown.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((circle) => {
              const ended =
                circle.status === "closed" ||
                Date.parse(circle.starts_at) + circle.duration * 60000 <= now;
              const full = circle.members >= circle.capacity;
              const Icon =
                circle.kind === "study"
                  ? BookOpen
                  : circle.kind === "exchange"
                    ? Repeat2
                    : Coffee;
              return (
                <article
                  key={circle.id}
                  className="companion-paper flex min-w-0 flex-col overflow-hidden"
                >
                  <div
                    className={`flex items-center justify-between gap-3 border-b border-black/5 p-5 ${circle.kind === "study" ? "bg-[#e9f0df]" : circle.kind === "exchange" ? "bg-[#eee8f4]" : "bg-[#f1e7d9]"}`}
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-ink">
                      <Icon size={19} aria-hidden="true" />
                      {t(`kinds.${circle.kind}`)}
                    </span>
                    <span className="rounded-full bg-paper/80 px-2.5 py-1.5 text-[11px] font-bold text-muted">
                      {t(ended ? "closed" : full ? "full" : "seatsLeft", {
                        count: circle.capacity - circle.members,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h2
                      dir="auto"
                      className="break-words text-xl font-bold leading-8 text-ink"
                    >
                      {circle.title}
                    </h2>
                    <p
                      dir="auto"
                      className="my-4 whitespace-pre-wrap break-words text-sm leading-7 text-muted"
                    >
                      {circle.description}
                    </p>
                    <div className="mt-auto space-y-3 pt-2 text-xs leading-6 text-muted">
                      <p className="flex items-start gap-2">
                        <CalendarDays
                          size={16}
                          aria-hidden="true"
                          className="mt-1 shrink-0"
                        />
                        <span>
                          {new Intl.DateTimeFormat(locale, {
                            timeZone: "Asia/Hebron",
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(circle.starts_at))}{" "}
                          · {t("duration", { count: circle.duration })}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin
                          size={16}
                          aria-hidden="true"
                          className="mt-1 shrink-0"
                        />
                        <span dir="auto" className="break-words">
                          {circle.location}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users size={16} aria-hidden="true" />
                        {t("memberCount", {
                          count: circle.members,
                          total: circle.capacity,
                        })}
                      </p>
                      <p>{t("hostedBy", { name: circle.host })}</p>
                    </div>
                    <div className="mt-5 flex gap-2 border-t border-line-soft pt-4">
                      {circle.is_host || circle.can_moderate ? (
                        <button
                          type="button"
                          disabled={busy || ended}
                          onClick={() => act(circle.id, "close")}
                          className="min-h-11 flex-1 rounded-xl bg-sage-soft px-3 py-3 text-xs font-bold text-ink disabled:opacity-50"
                        >
                          {t(ended ? "hostBadge" : "closeCircle")}
                        </button>
                      ) : circle.joined ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(circle.id, "leave")}
                          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-900"
                        >
                          <Check size={15} aria-hidden="true" />
                          {t("joinedLeave")}
                        </button>
                      ) : signedIn ? (
                        <button
                          type="button"
                          disabled={busy || ended || full}
                          onClick={() => act(circle.id, "join")}
                          className="min-h-11 flex-1 rounded-xl bg-[#254936] px-3 py-3 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {t(ended ? "closed" : full ? "full" : "join")}
                        </button>
                      ) : (
                        <Link
                          href="/auth/login"
                          className="min-h-11 flex-1 rounded-xl bg-[#254936] px-3 py-3 text-center text-xs font-bold text-white"
                        >
                          {t("signInToJoin")}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => copy(circle.id)}
                        aria-label={t("copyInvite")}
                        className="rounded-xl border border-line px-3 text-muted"
                      >
                        {copied === circle.id ? (
                          <Check size={16} aria-hidden="true" />
                        ) : (
                          <Copy size={16} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {circle.can_moderate && circle.reports > 0 && (
                      <div className="mt-4 rounded-xl bg-amber-50 p-3">
                        <p className="text-xs font-bold text-amber-900">
                          {t("pendingReports", { count: circle.reports })}
                        </p>
                        <p
                          dir="auto"
                          className="mt-2 break-words text-xs leading-7 text-amber-800"
                        >
                          {circle.moderation_note}
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(circle.id, "dismiss")}
                          className="mt-2 text-xs font-bold underline"
                        >
                          {t("dismissReport")}
                        </button>
                      </div>
                    )}
                    {signedIn && !circle.is_host && !ended && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setReportId(circle.id);
                          setReported(false);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted hover:text-amber-800"
                      >
                        <Flag size={12} aria-hidden="true" />
                        {t("reportCircle")}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="companion-paper mt-6 p-8 text-center sm:p-12">
            <Coffee
              size={38}
              aria-hidden="true"
              className="mx-auto mb-5 text-[#a0835a]"
            />
            <h2 className="text-xl font-bold">
              {t(target ? "missingCircle" : "emptyTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-muted">
              {t(target ? "missingHint" : "emptyHint")}
            </p>
          </section>
        )}
        <p className="mx-auto mt-7 flex max-w-3xl items-start justify-center gap-2 text-xs leading-7 text-muted">
          <Flag size={14} aria-hidden="true" className="mt-1.5 shrink-0" />
          {t("communityHint")}
        </p>
        {reportId && (
          <Modal
            title={t("reportCircle")}
            closeLabel={t("close")}
            onClose={() => setReportId(null)}
          >
            <form onSubmit={report} className="space-y-4">
              {error && (
                <p role="alert" className="text-sm text-amber-800">
                  {t(`errors.${error}`)}
                </p>
              )}
              <Field id="report-reason" label={t("reportReason")}>
                <textarea
                  id="report-reason"
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  required
                  className={fieldClass}
                />
              </Field>
              <p className="text-xs leading-7 text-muted">
                {t("reportPrivate")}
              </p>
              <button disabled={busy} className={saveClass}>
                {t("sendReport")}
              </button>
            </form>
          </Modal>
        )}
        {open && (
          <Modal
            title={t("hostCircle")}
            closeLabel={t("close")}
            onClose={() => setOpen(false)}
          >
            <form onSubmit={create} className="space-y-4">
              {(error || formError) && (
                <p
                  role="alert"
                  className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-900"
                >
                  {formError || t(`errors.${error}`)}
                </p>
              )}
              <fieldset disabled={busy} className="space-y-4">
                <Field id="circle-title" label={t("formTitle")}>
                  <input
                    id="circle-title"
                    name="title"
                    minLength={5}
                    maxLength={120}
                    required
                    placeholder={t("titleExample")}
                    className={fieldClass}
                  />
                </Field>
                <Field id="circle-kind" label={t("formKind")}>
                  <select
                    id="circle-kind"
                    name="kind"
                    defaultValue={kind === "all" ? "study" : kind}
                    className={fieldClass}
                  >
                    {["study", "exchange", "break"].map((value) => (
                      <option key={value} value={value}>
                        {t(`kinds.${value}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="circle-description" label={t("formDescription")}>
                  <textarea
                    id="circle-description"
                    name="description"
                    minLength={10}
                    maxLength={1200}
                    rows={3}
                    required
                    className={fieldClass}
                  />
                </Field>
                <Field id="circle-location" label={t("formLocation")}>
                  <input
                    id="circle-location"
                    name="location"
                    minLength={3}
                    maxLength={120}
                    required
                    placeholder={t("locationExample")}
                    className={fieldClass}
                  />
                </Field>
                <Field id="circle-starts" label={t("formTime")}>
                  <input
                    id="circle-starts"
                    name="starts"
                    type="datetime-local"
                    required
                    min={campusInputValue(now)}
                    defaultValue={campusInputValue(now + 30 * 60000)}
                    className={fieldClass}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="circle-duration" label={t("formDuration")}>
                    <input
                      id="circle-duration"
                      name="duration"
                      type="number"
                      min={15}
                      max={240}
                      defaultValue={25}
                      required
                      className={fieldClass}
                    />
                  </Field>
                  <Field id="circle-capacity" label={t("formCapacity")}>
                    <input
                      id="circle-capacity"
                      name="capacity"
                      type="number"
                      min={2}
                      max={12}
                      defaultValue={4}
                      required
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <p className="text-xs leading-7 text-muted">
                  {t("createHint")}
                </p>
                <button className={`${saveClass} w-full`}>
                  {t(busy ? "saving" : "publishCircle")}
                </button>
              </fieldset>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
