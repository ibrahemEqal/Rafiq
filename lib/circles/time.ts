import { CAMPUS_ZONE } from "../companion/model.ts";
export function campusInputValue(timestamp: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: CAMPUS_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(timestamp)
      .map((item) => [item.type, item.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function parseCampusInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const desired = Date.parse(`${value}:00Z`);
  if (
    !Number.isFinite(desired) ||
    new Date(desired).toISOString().slice(0, 16) !== value
  )
    return null;
  let guess = desired;
  for (let i = 0; i < 3; i++) {
    const presented = Date.parse(`${campusInputValue(guess)}:00Z`);
    guess += desired - presented;
  }
  return campusInputValue(guess) === value
    ? new Date(guess).toISOString()
    : null;
}
