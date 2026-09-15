import { z } from "zod";

export const MAX_RESOURCE_FILE_SIZE = 25 * 1024 * 1024;

export const resourceSchema = z.object({
  title: z.string().trim().min(3).max(160),
  type: z.enum(["previous_exam", "summary", "lecture", "assignment", "notes", "other"]),
  // PostgreSQL accepts UUID-shaped identifiers without RFC version/variant bits.
  // Keep the identifier shape check without rejecting existing seeded IDs.
  college_id: z.guid(),
  course_id: z.guid(),
  storage_path: z.string().min(3).max(500),
  file_size: z.number().int().positive().max(MAX_RESOURCE_FILE_SIZE),
  mime_type: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-zip-compressed",
  ]),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

const mimeByExtension = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  zip: "application/zip",
} as const;

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
