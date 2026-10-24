"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Sun,
  Cloud,
  HardDrive,
  RefreshCw,
  Plus,
  Check,
  Trash2,
  CalendarDays,
  Pencil,
  GraduationCap,
  Wallet,
  Mail,
  Settings2,
  ArrowUpLeft,
  Users,
  Clock3,
  Heart,
  Layers,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import {
  campusDate,
  campusClock,
  daySummary,
  nextWindow,
  hasScheduleConflict,
  moneyToCents,
  walletSummary,
} from "@/lib/companion/math";
import type { Snapshot, CompanionData } from "@/lib/companion/model";
import { useCompanion } from "./useCompanion";
import FocusTimer from "./FocusTimer";
import SemesterPanel from "./SemesterPanel";
import WalletPanel from "./WalletPanel";
import CapsulePanel from "./CapsulePanel";
import ShareDay from "./ShareDay";
import Modal from "./Modal";
import { Field, fieldClass, saveClass } from "./fields";
const tabs = ["day", "semester", "wallet", "capsules"] as const;
type Tab = (typeof tabs)[number];
type Editor = {
  kind: "task" | "lesson" | "expense" | "capsule" | "profile";
  id: string;
  task?: CompanionData["tasks"][number];
  lesson?: CompanionData["schedule"][number];
} | null;
function put<T extends { id: string }>(items: T[], entry: T) {
  return [...items.filter((item) => item.id !== entry.id), entry];
}
export default function CompanionApp({
  initial,
  mode,
  userId,
  initialNow,
  initialTab,
  initialMoment,
}: {
  initial: Snapshot;
  mode: "cloud" | "device";
  userId: string | null;
  initialNow: number;
  initialTab: string;
  initialMoment: string;
}) {
  const t = useTranslations("Companion");
  const locale = useLocale();
  const ar = locale === "ar";
  const {
    snapshot,
    busy,
    error,
    saved,
    save,
    reload,
    canImport,
    importGuest,
    clearStatus,
  } = useCompanion(initial, mode, userId);
  const data = snapshot.data;
  const [tab, setTab] = useState<Tab>(
    tabs.includes(initialTab as Tab) ? (initialTab as Tab) : "day",
  );
  const [editor, setEditor] = useState<Editor>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [now, setNow] = useState(initialNow);
  const [selectedDay, setSelectedDay] = useState(campusClock(initialNow).day);
  const [moment, setMoment] = useState<"free" | "overwhelmed" | null>(
    initialMoment === "free" || initialMoment === "overwhelmed"
      ? initialMoment
      : null,
  );
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  const today = campusDate(now);
  const summary = daySummary(data, today);
  const gap = nextWindow(data.schedule, now);
  const budget = walletSummary(data.wallet, today);
  const pending = data.tasks
    .filter((item) => !item.doneAt && item.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.minutes - b.minutes);
  const todayTasks = [
    ...pending,
    ...data.tasks.filter(
      (item) => item.doneAt && campusDate(Date.parse(item.doneAt)) === today,
    ),
  ];
  const tinyTask = [...data.tasks]
    .filter((item) => !item.doneAt)
    .sort((a, b) => a.minutes - b.minutes || a.date.localeCompare(b.date))[0];
  const weekday = (day: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 0, 4 + day)));
  const lessons = data.schedule
    .filter((item) => item.day === selectedDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  function go(next: Tab) {
    setTab(next);
    clearStatus();
    globalThis.window.history.replaceState(
      globalThis.window.history.state,
      "",
      `${globalThis.window.location.pathname}?tab=${next}`,
    );
  }
  function editLesson(lesson: CompanionData["schedule"][number]) {
    setFormError(null);
    clearStatus();
    setEditor({ kind: "lesson", id: lesson.id, lesson });
  }
  function editTask(task: CompanionData["tasks"][number]) {
    setFormError(null);
    clearStatus();
    setEditor({ kind: "task", id: task.id, task });
  }
  function open(kind: NonNullable<Editor>["kind"]) {
    setFormError(null);
    clearStatus();
    setEditor({ kind, id: crypto.randomUUID() });
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    setFormError(null);
    let ok = false;
    if (editor.kind === "profile")
      ok = await save("profile", {
        name: text("name"),
        intention: text("intention"),
        dailyMinutes: Number(text("dailyMinutes")),
      });
    if (editor.kind === "task")
      ok = await save(
        "tasks",
        put(data.tasks, {
          id: editor.id,
          title: text("title"),
          date: text("date"),
          kind: text("kind") as CompanionData["tasks"][number]["kind"],
          minutes: Number(text("minutes")),
          doneAt: editor.task?.doneAt ?? null,
        }),
      );
    if (editor.kind === "lesson") {
      const lesson = {
        id: editor.id,
        title: text("title"),
        day: Number(text("day")),
        start: text("start"),
        end: text("end"),
        location: text("location"),
      };
      if (lesson.end <= lesson.start) {
        setFormError(t("endAfterStart"));
        return;
      }
      if (hasScheduleConflict(data.schedule, lesson)) {
        setFormError(t("scheduleConflict"));
        return;
      }
      ok = await save("schedule", put(data.schedule, lesson));
    }
    if (editor.kind === "expense") {
      const cents = moneyToCents(text("amount"));
      if (cents === null || cents <= 0) {
        setFormError(t("validAmount"));
        return;
      }
      ok = await save("wallet", {
        ...data.wallet,
        expenses: put(data.wallet.expenses, {
          id: editor.id,
          title: text("title"),
          date: text("date"),
          cents,
          category: text(
            "category",
          ) as CompanionData["wallet"]["expenses"][number]["category"],
        }),
      });
    }
    if (editor.kind === "capsule")
      ok = await save(
        "capsules",
        put(data.capsules, {
          id: editor.id,
          title: text("title"),
          body: text("body"),
          opensOn: text("opensOn"),
          createdAt: new Date().toISOString(),
        }),
      );
    if (ok) setEditor(null);
  }
  async function toggleTask(id: string) {
    await save(
      "tasks",
      data.tasks.map((item) =>
        item.id === id
          ? { ...item, doneAt: item.doneAt ? null : new Date().toISOString() }
          : item,
      ),
    );
  }
  async function removeTask(id: string) {
    if (globalThis.window.confirm(t("deleteTaskConfirm")))
      await save(
        "tasks",
        data.tasks.filter((item) => item.id !== id),
      );
  }
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Hebron",
  }).format(now);
  return (
    <div className="companion-shell min-h-screen bg-[#f6f5ef] px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-bold text-[#788477]">{dateLabel}</p>
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold leading-tight text-[#173b31] sm:text-4xl">
              <span className="min-w-0 max-w-full [overflow-wrap:anywhere]">
                {t("hello", { name: data.profile.name || t("friend") })}
              </span>
              <Sun size={30} aria-hidden="true" className="text-[#c38d44]" />
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
              {t(`intentions.${data.profile.intention}`)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ShareDay
              name={data.profile.name}
              completed={summary.completed}
              minutes={summary.focusMinutes}
              date={today}
            />
            <button
              type="button"
              onClick={() => open("profile")}
              aria-label={t("editProfile")}
              className="rounded-full border border-slate-200 bg-white p-3 text-slate-600"
            >
              <Settings2 size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            {mode === "cloud" ? (
              <Cloud size={15} aria-hidden="true" />
            ) : (
              <HardDrive size={15} aria-hidden="true" />
            )}
            {t(mode === "cloud" ? "cloudSaved" : "deviceSaved")}
            {!userId && (
              <Link href="/auth/login" className="ms-1 underline">
                {t("signInToSync")}
              </Link>
            )}
          </p>
          {mode === "cloud" && (
            <button
              type="button"
              disabled={busy}
              onClick={reload}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"
            >
              <RefreshCw size={13} aria-hidden="true" />
              {t("refresh")}
            </button>
          )}
        </div>
        {canImport && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="max-w-2xl text-xs leading-7 text-emerald-900">
              {t("guestImportHint")}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={importGuest}
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900"
            >
              {t("importGuest")}
            </button>
          </div>
        )}
        {(error || saved) && (
          <p
            role={error ? "alert" : "status"}
            className={`mb-5 rounded-2xl border p-4 text-sm leading-7 ${error ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}
          >
            {error ? t(`errors.${error}`) : t("saved")}
          </p>
        )}
        <nav
          aria-label={t("workspaceTabs")}
          className="mb-7 grid grid-cols-4 gap-1 rounded-2xl border border-[#dfe4da] bg-white p-1.5 sm:w-fit sm:gap-2"
        >
          {tabs.map((value, index) => {
            const Icon = [Sun, GraduationCap, Wallet, Mail][index];
            return (
              <button
                key={value}
                type="button"
                aria-current={tab === value ? "page" : undefined}
                onClick={() => go(value)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:px-6 sm:text-sm ${tab === value ? "bg-[#1c4337] text-white shadow-sm" : "text-slate-500 hover:bg-[#f3f5ee]"}`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{t(`tabs.${value}`)}</span>
              </button>
            );
          })}
        </nav>
        {tab === "day" && (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 space-y-5">
              <section className="relative overflow-hidden rounded-[1.75rem] bg-[#e8eddf] p-5 sm:p-7">
                <div
                  aria-hidden="true"
                  className="absolute -end-12 -top-16 size-56 rounded-full border-[35px] border-white/25"
                />
                <div className="relative">
                  <p className="companion-eyebrow">
                    <Sparkles size={15} aria-hidden="true" />
                    {t("momentEyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#243f31]">
                    {t("momentTitle")}
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMoment(moment === "free" ? null : "free")
                      }
                      className={`companion-moment ${moment === "free" ? "ring-2 ring-emerald-700" : ""}`}
                    >
                      <Clock3 size={15} aria-hidden="true" />
                      {t("momentFree")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMoment(
                          moment === "overwhelmed" ? null : "overwhelmed",
                        )
                      }
                      className={`companion-moment ${moment === "overwhelmed" ? "ring-2 ring-emerald-700" : ""}`}
                    >
                      <Layers size={15} aria-hidden="true" />
                      {t("momentOverwhelmed")}
                    </button>
                    <Link href="/circles" className="companion-moment">
                      <Users size={15} aria-hidden="true" />
                      {t("momentCompany")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => go("wallet")}
                      className="companion-moment"
                    >
                      <Wallet size={15} aria-hidden="true" />
                      {t("momentBudget")}
                    </button>
                  </div>
                  {moment && (
                    <div
                      role="status"
                      className="mt-5 rounded-2xl bg-white/65 p-4 text-sm leading-8 text-[#344e3c]"
                    >
                      {moment === "free"
                        ? gap.current
                          ? t("currentClass", { name: gap.current.title })
                          : gap.next
                            ? t("freeWindow", {
                                minutes: gap.freeMinutes ?? 0,
                                name: gap.next.title,
                              })
                            : t("noNextClass")
                        : tinyTask
                          ? t("smallStep", {
                              title: tinyTask.title,
                              minutes: tinyTask.minutes,
                            })
                          : t("noPendingSteps")}
                    </div>
                  )}
                </div>
              </section>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["doneToday", summary.completed, CheckCheck],
                  ["focusToday", summary.focusMinutes, Clock3],
                  ["pendingToday", pending.length, CalendarDays],
                ].map(([label, count, Icon]) => {
                  const Symbol = Icon as typeof Check;
                  return (
                    <div
                      key={String(label)}
                      className="companion-paper p-4 sm:p-5"
                    >
                      <Symbol
                        size={18}
                        aria-hidden="true"
                        className="mb-3 text-emerald-800"
                      />
                      <p className="text-2xl font-bold text-[#1d3b31]">
                        {String(count)}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500 sm:text-xs">
                        {t(String(label))}
                      </p>
                    </div>
                  );
                })}
              </div>
              <section className="companion-paper p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="companion-eyebrow">{t("oneStep")}</p>
                    <h2 className="mt-1 text-xl font-bold">{t("dayTasks")}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => open("task")}
                    className="companion-add"
                  >
                    <Plus size={17} aria-hidden="true" />
                    {t("addTask")}
                  </button>
                </div>
                {todayTasks.length ? (
                  <ul className="space-y-2">
                    {todayTasks.map((task) => (
                      <li
                        key={task.id}
                        className={`flex items-start gap-3 rounded-2xl border p-3.5 ${task.doneAt ? "border-transparent bg-[#f4f6ef]" : "border-slate-200 bg-white"}`}
                      >
                        <input
                          type="checkbox"
                          aria-label={t("completeNamed", { name: task.title })}
                          checked={Boolean(task.doneAt)}
                          disabled={busy}
                          onChange={() => toggleTask(task.id)}
                          className="mt-1 size-5 shrink-0 accent-emerald-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            dir="auto"
                            className={`break-words text-sm font-bold leading-7 ${task.doneAt ? "text-slate-400 line-through" : "text-slate-800"}`}
                          >
                            {task.title}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {t(`taskKinds.${task.kind}`)} ·{" "}
                            {t("minutes", { count: task.minutes })}
                            {task.date < today && !task.doneAt
                              ? ` · ${task.date}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => editTask(task)}
                          aria-label={t("editNamed", { name: task.title })}
                          className="rounded-lg p-2 text-slate-400 hover:text-emerald-800"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeTask(task.id)}
                          aria-label={t("deleteNamed", { name: task.title })}
                          className="rounded-lg p-2 text-slate-400 hover:text-red-700"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="companion-empty">
                    <CheckCheck
                      size={30}
                      aria-hidden="true"
                      className="mx-auto mb-3 text-emerald-700"
                    />
                    {t("noTasks")}
                  </div>
                )}
                {data.tasks.some(
                  (item) => !item.doneAt && item.date > today,
                ) && (
                  <details className="mt-5 rounded-xl bg-[#f6f7f2] p-4">
                    <summary className="cursor-pointer text-xs font-bold text-slate-600">
                      {t("upcomingTasks")}
                    </summary>
                    <ul className="mt-3 space-y-3">
                      {[...data.tasks]
                        .filter((item) => !item.doneAt && item.date > today)
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p dir="auto" className="break-words font-medium">
                                {task.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                {task.date} · {t(`taskKinds.${task.kind}`)}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => editTask(task)}
                              aria-label={t("editNamed", { name: task.title })}
                              className="rounded-lg p-2 text-slate-400 hover:text-emerald-800"
                            >
                              <Pencil size={15} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => removeTask(task.id)}
                              aria-label={t("deleteNamed", {
                                name: task.title,
                              })}
                              className="p-2 text-slate-400"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
                {data.tasks.some(
                  (item) =>
                    item.doneAt && campusDate(Date.parse(item.doneAt)) < today,
                ) && (
                  <details className="mt-5 rounded-xl border border-slate-100 p-4">
                    <summary className="cursor-pointer text-xs font-bold text-slate-500">
                      {t("completedArchive")}
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {data.tasks
                        .filter(
                          (item) =>
                            item.doneAt &&
                            campusDate(Date.parse(item.doneAt)) < today,
                        )
                        .slice(-20)
                        .reverse()
                        .map((item) => (
                          <li
                            key={item.id}
                            dir="auto"
                            className="text-xs leading-7 text-slate-500"
                          >
                            ✓ {item.title}
                          </li>
                        ))}
                    </ul>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          globalThis.window.confirm(t("clearCompletedConfirm"))
                        )
                          save(
                            "tasks",
                            data.tasks.filter(
                              (item) =>
                                !item.doneAt ||
                                campusDate(Date.parse(item.doneAt)) >= today,
                            ),
                          );
                      }}
                      className="mt-3 text-xs font-bold text-red-700"
                    >
                      {t("clearCompleted")}
                    </button>
                  </details>
                )}
              </section>
              <section className="companion-paper p-5 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="companion-eyebrow">{t("campusTime")}</p>
                    <h2 className="mt-1 text-xl font-bold">
                      {t("weeklySchedule")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => open("lesson")}
                    className="companion-add"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t("addClass")}
                  </button>
                </div>
                <div className="mb-5 grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }, (_, day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      aria-pressed={selectedDay === day}
                      className={`min-h-11 rounded-xl px-1 py-2 text-[10px] font-bold sm:text-xs ${selectedDay === day ? "bg-[#dfead8] text-emerald-900" : "bg-slate-50 text-slate-500"}`}
                    >
                      {weekday(day)}
                    </button>
                  ))}
                </div>
                {lessons.length ? (
                  <ul className="space-y-3">
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 rounded-xl border-s-4 border-emerald-700 bg-[#f7f8f3] p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h3
                            dir="auto"
                            className="break-words text-sm font-bold"
                          >
                            {lesson.title}
                          </h3>
                          <p className="mt-1 break-words text-xs text-slate-500">
                            <span dir="ltr">
                              {lesson.start} – {lesson.end}
                            </span>
                            {lesson.location && ` · ${lesson.location}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => editLesson(lesson)}
                          aria-label={t("editNamed", { name: lesson.title })}
                          className="p-2 text-slate-400 hover:text-emerald-800"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (
                              globalThis.window.confirm(t("deleteClassConfirm"))
                            )
                              save(
                                "schedule",
                                data.schedule.filter(
                                  (item) => item.id !== lesson.id,
                                ),
                              );
                          }}
                          aria-label={t("deleteNamed", { name: lesson.title })}
                          className="p-2 text-slate-400 hover:text-red-700"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="companion-empty">{t("noClasses")}</p>
                )}
              </section>
            </div>
            <aside className="min-w-0 space-y-5">
              <FocusTimer
                userKey={userId ?? "guest"}
                initialNow={initialNow}
                busy={busy}
                onFinish={async (id, minutes) =>
                  data.focus.some((item) => item.id === id) ||
                  (await save("focus", [
                    ...data.focus.slice(-239),
                    { id, minutes, finishedAt: new Date().toISOString() },
                  ]))
                }
              />
              <section className="companion-paper p-5">
                <p className="companion-eyebrow">
                  <Heart size={14} aria-hidden="true" />
                  {t("dailyIntention")}
                </p>
                <p className="my-4 text-sm font-bold leading-8 text-slate-700">
                  {summary.completed
                    ? t("progressNudge", { count: summary.completed })
                    : t("gentleNudge")}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#7c9f69]"
                    style={{
                      width: `${Math.min(100, (summary.focusMinutes / data.profile.dailyMinutes) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t("focusGoal", {
                    done: summary.focusMinutes,
                    goal: data.profile.dailyMinutes,
                  })}
                </p>
              </section>
              <Link
                href="/circles"
                className="block rounded-[1.75rem] bg-[#eee8db] p-6"
              >
                <Users
                  size={26}
                  aria-hidden="true"
                  className="text-[#89613c]"
                />
                <h2 className="mt-5 text-xl font-bold text-[#4c4534]">
                  {t("circleTeaserTitle")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#7a705b]">
                  {t("circleTeaserHint")}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#685237]">
                  {t("discoverCircles")}
                  <ArrowUpLeft
                    size={15}
                    aria-hidden="true"
                    className={!ar ? "rotate-90" : ""}
                  />
                </span>
              </Link>
              {budget.daily !== null && (
                <button
                  type="button"
                  onClick={() => go("wallet")}
                  className="companion-paper w-full p-5 text-start"
                >
                  <p className="companion-eyebrow">
                    <Wallet size={14} aria-hidden="true" />
                    {t("dailyAllowance")}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-[#214735]">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: "ILS",
                    }).format(budget.daily / 100)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t("walletQuickHint")}
                  </p>
                </button>
              )}
            </aside>
          </div>
        )}
        {tab === "semester" && (
          <SemesterPanel
            plan={data.semester}
            busy={busy}
            onSave={(plan) => save("semester", plan)}
          />
        )}
        {tab === "wallet" && (
          <WalletPanel
            wallet={data.wallet}
            today={today}
            busy={busy}
            onAdd={() => open("expense")}
            onSave={(wallet) => save("wallet", wallet)}
          />
        )}
        {tab === "capsules" && (
          <CapsulePanel
            capsules={data.capsules}
            today={today}
            busy={busy}
            onAdd={() => open("capsule")}
            onRemove={(id) =>
              save(
                "capsules",
                data.capsules.filter((item) => item.id !== id),
              )
            }
          />
        )}
        <p className="mt-10 text-center text-[11px] leading-7 text-slate-400">
          {t("yourSpaceHint")}
        </p>
        {editor && (
          <Modal
            title={t(
              editor.task
                ? "editTask"
                : editor.lesson
                  ? "editClass"
                  : `editors.${editor.kind}`,
            )}
            closeLabel={t("close")}
            onClose={() => setEditor(null)}
          >
            <form onSubmit={submit} className="space-y-4">
              {formError && (
                <p
                  role="alert"
                  className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
                >
                  {formError}
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-amber-50 p-3 text-sm leading-7 text-amber-900"
                >
                  {t(`errors.${error}`)}
                </p>
              )}
              <fieldset
                disabled={busy}
                className="space-y-4 disabled:opacity-60"
              >
                {editor.kind === "profile" ? (
                  <>
                    <Field id="profile-name" label={t("yourName")}>
                      <input
                        id="profile-name"
                        name="name"
                        maxLength={50}
                        defaultValue={data.profile.name}
                        className={fieldClass}
                      />
                    </Field>
                    <Field id="profile-intention" label={t("chooseIntention")}>
                      <select
                        id="profile-intention"
                        name="intention"
                        defaultValue={data.profile.intention}
                        className={fieldClass}
                      >
                        {["light", "steady", "focused"].map((value) => (
                          <option key={value} value={value}>
                            {t(`intentionNames.${value}`)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="daily-goal" label={t("dailyGoalMinutes")}>
                      <input
                        id="daily-goal"
                        name="dailyMinutes"
                        type="number"
                        min={10}
                        max={300}
                        defaultValue={data.profile.dailyMinutes}
                        required
                        className={fieldClass}
                      />
                    </Field>
                  </>
                ) : (
                  <Field
                    id="entry-title"
                    label={t(
                      editor.kind === "capsule"
                        ? "capsuleName"
                        : editor.kind === "expense"
                          ? "expenseName"
                          : editor.kind === "lesson"
                            ? "className"
                            : "taskName",
                    )}
                  >
                    <input
                      id="entry-title"
                      name="title"
                      defaultValue={editor.task?.title ?? editor.lesson?.title}
                      maxLength={editor.kind === "task" ? 140 : 100}
                      required
                      className={fieldClass}
                    />
                  </Field>
                )}
                {editor.kind === "task" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="entry-date" label={t("date")}>
                        <input
                          id="entry-date"
                          name="date"
                          type="date"
                          defaultValue={editor.task?.date ?? today}
                          required
                          className={fieldClass}
                        />
                      </Field>
                      <Field id="task-minutes" label={t("estimatedMinutes")}>
                        <input
                          id="task-minutes"
                          name="minutes"
                          type="number"
                          min={5}
                          max={240}
                          step={5}
                          defaultValue={editor.task?.minutes ?? 25}
                          required
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                    <Field id="task-kind" label={t("taskKind")}>
                      <select
                        id="task-kind"
                        name="kind"
                        defaultValue={editor.task?.kind ?? "task"}
                        className={fieldClass}
                      >
                        {["task", "exam", "life"].map((value) => (
                          <option key={value} value={value}>
                            {t(`taskKinds.${value}`)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                {editor.kind === "lesson" && (
                  <>
                    <Field id="lesson-day" label={t("weekday")}>
                      <select
                        id="lesson-day"
                        name="day"
                        defaultValue={editor.lesson?.day ?? selectedDay}
                        className={fieldClass}
                      >
                        {Array.from({ length: 7 }, (_, day) => (
                          <option key={day} value={day}>
                            {weekday(day)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="lesson-start" label={t("starts")}>
                        <input
                          id="lesson-start"
                          name="start"
                          type="time"
                          defaultValue={editor.lesson?.start}
                          required
                          className={fieldClass}
                        />
                      </Field>
                      <Field id="lesson-end" label={t("ends")}>
                        <input
                          id="lesson-end"
                          name="end"
                          type="time"
                          defaultValue={editor.lesson?.end}
                          required
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                    <Field id="lesson-location" label={t("classLocation")}>
                      <input
                        id="lesson-location"
                        name="location"
                        defaultValue={editor.lesson?.location}
                        maxLength={100}
                        className={fieldClass}
                      />
                    </Field>
                  </>
                )}
                {editor.kind === "expense" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="expense-amount" label={t("amountNis")}>
                        <input
                          id="expense-amount"
                          name="amount"
                          type="number"
                          min="0.01"
                          max="1000000"
                          step="0.01"
                          required
                          className={fieldClass}
                        />
                      </Field>
                      <Field id="entry-date" label={t("date")}>
                        <input
                          id="entry-date"
                          name="date"
                          type="date"
                          max={today}
                          defaultValue={today}
                          required
                          className={fieldClass}
                        />
                      </Field>
                    </div>
                    <Field id="expense-category" label={t("expenseCategory")}>
                      <select
                        id="expense-category"
                        name="category"
                        className={fieldClass}
                      >
                        {["food", "transport", "study", "other"].map(
                          (value) => (
                            <option key={value} value={value}>
                              {t(`expenseCategories.${value}`)}
                            </option>
                          ),
                        )}
                      </select>
                    </Field>
                  </>
                )}
                {editor.kind === "capsule" && (
                  <>
                    <Field id="capsule-date" label={t("capsuleDate")}>
                      <input
                        id="capsule-date"
                        name="opensOn"
                        type="date"
                        min={today}
                        required
                        className={fieldClass}
                      />
                    </Field>
                    <Field id="capsule-body" label={t("capsuleBody")}>
                      <textarea
                        id="capsule-body"
                        name="body"
                        rows={6}
                        maxLength={3000}
                        required
                        placeholder={t("capsuleExample")}
                        className={fieldClass}
                      />
                    </Field>
                    <p className="text-xs leading-6 text-slate-500">
                      {t("capsulePrivacy")}
                    </p>
                  </>
                )}
                <button className={`${saveClass} w-full`}>
                  {t(busy ? "saving" : "save")}
                </button>
              </fieldset>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
