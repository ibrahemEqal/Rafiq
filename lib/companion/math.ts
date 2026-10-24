import { CAMPUS_ZONE, type CompanionData } from "./model.ts";
export function campusDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(timestamp);
}
export function campusClock(timestamp: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CAMPUS_ZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(timestamp)
      .map((part) => [part.type, part.value]),
  );
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      parts.weekday,
    ),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}
export function timeMinutes(time: string) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}
export function nextWindow(schedule: CompanionData["schedule"], now: number) {
  const clock = campusClock(now);
  const today = schedule
    .filter((item) => item.day === clock.day)
    .sort((a, b) => a.start.localeCompare(b.start));
  const current = today.find(
    (item) =>
      timeMinutes(item.start) <= clock.minutes &&
      timeMinutes(item.end) > clock.minutes,
  );
  const next = today.find((item) => timeMinutes(item.start) > clock.minutes);
  return {
    current,
    next,
    freeMinutes: current
      ? 0
      : next
        ? timeMinutes(next.start) - clock.minutes
        : null,
    today,
  };
}
export function hasScheduleConflict(
  items: CompanionData["schedule"],
  candidate: CompanionData["schedule"][number],
) {
  return items.some(
    (item) =>
      item.id !== candidate.id &&
      item.day === candidate.day &&
      timeMinutes(candidate.start) < timeMinutes(item.end) &&
      timeMinutes(candidate.end) > timeMinutes(item.start),
  );
}
export function semesterProjection(plan: CompanionData["semester"]) {
  const credits = plan.courses.reduce((sum, item) => sum + item.credits, 0);
  const points = plan.courses.reduce(
    (sum, item) => sum + item.credits * item.points,
    0,
  );
  const totalCredits = plan.previousCredits + credits;
  return {
    credits,
    semester: credits ? points / credits : null,
    projected: totalCredits
      ? (plan.previousCredits * plan.previousAverage + points) / totalCredits
      : null,
    required: credits
      ? (plan.target * totalCredits -
          plan.previousCredits * plan.previousAverage) /
        credits
      : null,
  };
}
export function walletSummary(wallet: CompanionData["wallet"], today: string) {
  const month = today.slice(0, 7);
  const expenses = wallet.expenses.filter(
    (item) => item.date.startsWith(month) && item.date <= today,
  );
  const spent = expenses.reduce((sum, item) => sum + item.cents, 0);
  const days = new Date(
    Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0),
  ).getUTCDate();
  const remainingDays = days - Number(today.slice(8)) + 1;
  const remaining = wallet.budgetCents - spent;
  return {
    expenses,
    spent,
    remaining,
    remainingDays,
    daily: wallet.budgetCents
      ? Math.max(0, Math.floor(remaining / remainingDays))
      : null,
  };
}
export function daySummary(data: CompanionData, today: string) {
  const completed = data.tasks.filter(
    (task) => task.doneAt && campusDate(Date.parse(task.doneAt)) === today,
  ).length;
  const focusMinutes = data.focus
    .filter((item) => campusDate(Date.parse(item.finishedAt)) === today)
    .reduce((sum, item) => sum + item.minutes, 0);
  const nextTask = [...data.tasks]
    .filter((item) => !item.doneAt)
    .sort((a, b) => a.date.localeCompare(b.date) || a.minutes - b.minutes)[0];
  return { completed, focusMinutes, nextTask };
}
export function moneyToCents(raw: string) {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw.trim())) return null;
  const cents = Math.round(Number(raw) * 100);
  return Number.isSafeInteger(cents) && cents <= 100_000_000 ? cents : null;
}
