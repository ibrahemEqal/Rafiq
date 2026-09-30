import { z } from "zod";

export const MAX_RESOURCE_FILE_SIZE = 25 * 1024 * 1024;

const resourceBaseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.enum(["previous_exam", "summary", "lecture", "assignment", "notes", "other"]),
  // PostgreSQL accepts UUID-shaped identifiers without RFC version/variant bits.
  // Keep the identifier shape check without rejecting existing seeded IDs.
  college_id: z.guid(),
  course_id: z.guid(),
});

const uploadResourceSchema = resourceBaseSchema.extend({
  source_type: z.literal("upload"),
  storage_path: z.string().min(3).max(500),
  external_url: z.null().optional(),
  file_size: z.number().int().positive().max(MAX_RESOURCE_FILE_SIZE),
  mime_type: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ]),
});

const externalResourceSchema = resourceBaseSchema.extend({
  source_type: z.literal("external"),
  storage_path: z.null().optional(),
  external_url: z.string().trim().url().max(1200).refine(isAllowedExternalResourceUrl, {
    message: "Only Google Drive or Google Docs links are supported.",
  }),
  file_size: z.null().optional(),
  mime_type: z.null().optional(),
});

export const resourceSchema = z.discriminatedUnion("source_type", [
  uploadResourceSchema,
  externalResourceSchema,
]);

export type ResourceInput = z.infer<typeof resourceSchema>;

const mimeByExtension = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
} as const;

export function isAllowedExternalResourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "drive.google.com" || host === "docs.google.com";
  } catch {
    return false;
  }
}

// Browser File.type may be empty or OS-dependent. These are MIME metadata,
// not a security check of file contents; only supported extensions are accepted.
export function getResourceFileMetadata(name: string) {
  const extension = /\.(pdf|doc|docx|zip)$/i.exec(name)?.[1].toLowerCase();
  if (!extension) return null;
  const mimeType = mimeByExtension[extension as keyof typeof mimeByExtension];
  return { extension, mimeType };
}

export function formatResourceValidationError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "resource"}: ${issue.message}`)
    .join("\n");
}
