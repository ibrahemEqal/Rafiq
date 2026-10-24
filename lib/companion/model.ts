import { z } from "zod";

export const CAMPUS_ZONE = "Asia/Hebron";
const id = z.guid();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const task = z.object({
  id,
  title: z.string().trim().min(1).max(140),
  date,
  kind: z.enum(["task", "exam", "life"]),
  minutes: z.number().int().min(5).max(240),
  doneAt: z.iso.datetime().nullable(),
});
const lesson = z
  .object({
    id,
    title: z.string().trim().min(1).max(100),
    day: z.number().int().min(0).max(6),
    start: time,
    end: time,
    location: z.string().trim().max(100),
  })
  .refine((value) => value.end > value.start, { message: "end_after_start" });
const course = z.object({
  id,
  title: z.string().trim().min(1).max(100),
  credits: z.number().min(0.5).max(12),
  points: z.number().min(0).max(100),
});
const expense = z.object({
  id,
  title: z.string().trim().min(1).max(100),
  cents: z.number().int().min(1).max(100_000_000),
  date,
  category: z.enum(["food", "transport", "study", "other"]),
});
const capsule = z.object({
  id,
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(3000),
  opensOn: date,
  createdAt: z.iso.datetime(),
});
export const sections = {
  profile: z.object({
    name: z.string().trim().max(50),
    intention: z.enum(["light", "steady", "focused"]),
    dailyMinutes: z.number().int().min(10).max(300),
  }),
  tasks: z.array(task).max(200),
  schedule: z.array(lesson).max(50),
  semester: z
    .object({
      scale: z.union([z.literal(4), z.literal(100)]),
      previousCredits: z.number().min(0).max(400),
      previousAverage: z.number().min(0).max(100),
      target: z.number().min(0).max(100),
      courses: z.array(course).max(20),
    })
    .refine(
      (value) =>
        value.previousAverage <= value.scale &&
        value.target <= value.scale &&
        value.courses.every((item) => item.points <= value.scale),
      { message: "points_outside_scale" },
    ),
  wallet: z.object({
    budgetCents: z.number().int().min(0).max(100_000_000),
    expenses: z.array(expense).max(400),
  }),
  capsules: z.array(capsule).max(40),
  focus: z
    .array(
      z.object({
        id,
        minutes: z.number().int().min(1).max(120),
        finishedAt: z.iso.datetime(),
      }),
    )
    .max(240),
};
export type Section = keyof typeof sections;
export type CompanionData = { [K in Section]: z.infer<(typeof sections)[K]> };
export type Snapshot = {
  data: CompanionData;
  versions: Record<Section, number>;
};
export type CompanionError =
  "unauthorized" | "invalid" | "conflict" | "unavailable" | "failed";
export const sectionNames = Object.keys(sections) as Section[];
export function emptySnapshot(): Snapshot {
  return {
    data: {
      profile: { name: "", intention: "steady", dailyMinutes: 50 },
      tasks: [],
      schedule: [],
      semester: {
        scale: 4,
        previousCredits: 0,
        previousAverage: 0,
        target: 3,
        courses: [],
      },
      wallet: { budgetCents: 0, expenses: [] },
      capsules: [],
      focus: [],
    },
    versions: {
      profile: 0,
      tasks: 0,
      schedule: 0,
      semester: 0,
      wallet: 0,
      capsules: 0,
      focus: 0,
    },
  };
}
export function parseSection(section: unknown, payload: unknown) {
  if (typeof section !== "string" || !sectionNames.includes(section as Section))
    return null;
  const key = section as Section;
  const result = sections[key].safeParse(payload);
  if (!result.success) return null;
  if (
    Array.isArray(result.data) &&
    new Set(result.data.map((item) => item.id)).size !== result.data.length
  )
    return null;
  if (key === "semester") {
    const courses = (result.data as CompanionData["semester"]).courses;
    if (new Set(courses.map((item) => item.id)).size !== courses.length)
      return null;
  }
  return { section: key, payload: result.data };
}
export function restoreSnapshot(raw: unknown): Snapshot | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("data" in raw) ||
    !("versions" in raw)
  )
    return null;
  const result = emptySnapshot();
  for (const section of sectionNames) {
    const payload = (raw.data as Record<string, unknown>)?.[section];
    const version = (raw.versions as Record<string, unknown>)?.[section];
    const parsed = parseSection(section, payload);
    if (
      !parsed ||
      typeof version !== "number" ||
      !Number.isSafeInteger(version) ||
      version < 0
    )
      return null;
    Object.assign(result.data, { [section]: parsed.payload });
    result.versions[section] = version;
  }
  return result;
}
export function databaseError(error: {
  code?: string;
  message?: string;
}): CompanionError {
  if (["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code ?? ""))
    return "unavailable";
  if (error.message?.includes("companion_conflict")) return "conflict";
  if (error.code === "42501") return "unauthorized";
  return "failed";
}

// A signed account's device copy takes precedence over a guest copy. Never overwrite saved account sections.
export function planImports(
  target: Snapshot,
  local: Snapshot | null,
  guest: Snapshot | null,
) {
  return sectionNames.flatMap((section) => {
    if (target.versions[section] !== 0) return [];
    const source = local && local.versions[section] > 0 ? local : guest;
    return source && source.versions[section] > 0
      ? [{ section, payload: source.data[section] }]
      : [];
  });
}
