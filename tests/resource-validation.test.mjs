import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceSchema,
  getResourceFileMetadata,
  formatResourceValidationError,
  MAX_RESOURCE_FILE_SIZE,
} from "../lib/validation/resource.ts";

const valid = {
  title: "Algorithms summary",
  type: "summary",
  college_id: "afc00000-0000-4000-8000-000000000001",
  course_id: "afc00000-0000-4000-8000-000000000002",
  storage_path: "afc00000-0000-4000-8000-000000000003/file.pdf",
  file_size: 1024,
  mime_type: "application/pdf",
};

test("valid resource payload is accepted and the title is trimmed", () => {
  assert.equal(resourceSchema.parse({ ...valid, title: "  Algorithms summary  " }).title, valid.title);
});

test("PostgreSQL-compatible seeded identifiers are accepted", () => {
  assert.equal(resourceSchema.safeParse({
    ...valid,
    college_id: "11111111-1111-1111-1111-111111111111",
    course_id: "22222222-2222-2222-2222-222222222222",
  }).success, true);
});

for (const field of ["college_id", "course_id"]) {
  test(`invalid ${field} is rejected and identified in the error`, () => {
    const result = resourceSchema.safeParse({ ...valid, [field]: "not-an-id" });
    assert.equal(result.success, false);
    assert.match(formatResourceValidationError(result.error), new RegExp(field));
  });
}

for (const title of ["a", "   ", "a".repeat(161)]) {
  test(`invalid title of length ${title.length} is rejected`, () => {
    const result = resourceSchema.safeParse({ ...valid, title });
    assert.equal(result.success, false);
    assert.match(formatResourceValidationError(result.error), /title:/);
  });
}

for (const file_size of [0, MAX_RESOURCE_FILE_SIZE + 1]) {
  test(`invalid file size ${file_size} is rejected`, () => {
    const result = resourceSchema.safeParse({ ...valid, file_size });
    assert.equal(result.success, false);
    assert.match(formatResourceValidationError(result.error), /file_size:/);
  });
}

test("exactly 25 MiB is allowed", () => {
  assert.equal(resourceSchema.safeParse({ ...valid, file_size: MAX_RESOURCE_FILE_SIZE }).success, true);
});

for (const [name, mimeType] of [
  ["notes.PDF", "application/pdf"],
  ["notes.doc", "application/msword"],
  ["notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["archive.zip", "application/zip"],
]) {
  test(`${name} gets canonical MIME metadata without relying on File.type`, () => {
    const metadata = getResourceFileMetadata(name);
    assert.equal(metadata.mimeType, mimeType);
    assert.equal(resourceSchema.safeParse({ ...valid, mime_type: metadata.mimeType }).success, true);
  });
}

test("unsupported or missing file extensions are rejected", () => {
  for (const name of ["malware.exe", "notes.pdf.exe", "noextension", "pdf"]) {
    assert.equal(getResourceFileMetadata(name), null);
  }
});

test("arbitrary MIME types are still rejected on the server", () => {
  const result = resourceSchema.safeParse({ ...valid, mime_type: "text/html" });
  assert.equal(result.success, false);
  assert.match(formatResourceValidationError(result.error), /mime_type:/);
});

test("the obsolete exam enum value remains rejected", () => {
  assert.equal(resourceSchema.safeParse({ ...valid, type: "exam" }).success, false);
});
