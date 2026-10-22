import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWhatsapp, bookFilters, bookListHref, bookTitlePattern, bookSchema } from "../lib/books/market.ts";

const valid = { title: "Calculus 1", description: "2025 edition", type: "book", college_id: "afc00000-0000-4000-8000-000000000005", whatsapp_number: "+970 599-123-456" };

test("WhatsApp numbers accept international and Palestinian mobile formats", () => {
  for (const number of ["+970 599-123-456", "00970599123456", "0599123456", "970599123456"]) assert.equal(normalizeWhatsapp(number), "970599123456");
  assert.equal(normalizeWhatsapp("0569123456"), "970569123456");
  assert.equal(normalizeWhatsapp("+972 50 123 4567"), "972501234567");
  for (const number of [null, "abc", "123", "0000", "javascript:123456789", "970599123456789012", "0551234567"]) assert.equal(normalizeWhatsapp(number), null);
});

test("book payloads are trimmed, normalized and bounded", () => {
  const parsed = bookSchema.parse({ ...valid, title: "  Calculus 1  " });
  assert.equal(parsed.title, "Calculus 1"); assert.equal(parsed.whatsapp_number, "970599123456");
  for (const fields of [{ title: "a" }, { title: "x".repeat(161) }, { description: "x".repeat(2001) }, { type: "paid" }, { college_id: "invalid" }, { whatsapp_number: "123" }]) assert.equal(bookSchema.safeParse({ ...valid, ...fields }).success, false);
});

test("market filters have safe defaults, bounded pages and literal title patterns", () => {
  assert.deepEqual(bookFilters({ type: "unknown", college: "bad", page: "Infinity", q: ["a", "b"], sort: "injected" }), { type: "", college: "", page: 1, q: "", sort: "newest" });
  assert.equal(bookFilters({ page: "9999" }).page, 1000);
  assert.equal(bookFilters({ page: "0", q: "  math  " }).q, "math");
  assert.equal(bookFilters({ page: "0" }).page, 1);
  assert.equal(bookTitlePattern("100%_notes\\"), "%100\\%\\_notes\\\\%");
});

test("type tabs and pagination preserve filters and safely encode search strings", () => {
  const filters = bookFilters({ q: "Math & physics", college: valid.college_id, type: "book", page: "2", sort: "oldest" });
  const next = new URL(bookListHref(filters, { page: 3 }), "https://rafiq.example");
  assert.equal(next.searchParams.get("q"), "Math & physics"); assert.equal(next.searchParams.get("page"), "3"); assert.equal(next.searchParams.get("college"), valid.college_id);
  const tab = new URL(bookListHref(filters, { type: "printed_slides", page: 1 }), "https://rafiq.example");
  assert.equal(tab.searchParams.get("page"), null); assert.equal(tab.searchParams.get("type"), "printed_slides");
});
