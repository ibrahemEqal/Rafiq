import assert from "node:assert/strict";
import test from "node:test";
import { courseSearchTerm, courseSearchFilter } from "../lib/data/course-search.ts";

test("course search supports Arabic, English and course codes", () => {
  for (const term of ["اللغة العربية", "Computer Networks", "11000101", "CS-101"]) {
    assert.equal(courseSearchTerm(`  ${term}  `), term);
    assert.match(courseSearchFilter(term), /name_ar\.ilike/);
    assert.ok(courseSearchFilter(term).includes(`code.ilike.%${term}%`));
  }
});

test("course search is bounded and short or repeated query values are ignored", () => {
  assert.equal(courseSearchTerm("a".repeat(90)).length, 80);
  for (const term of [undefined, ["Arabic", "English"], "a", "  ", "%_"]) assert.equal(courseSearchFilter(term), null);
});

test("PostgREST operators, quotes and LIKE wildcards cannot become filter syntax", () => {
  const term = courseSearchTerm('a%,id.not.is.null),name_ar.ilike.("*\\_');
  assert.doesNotMatch(term, /[%,()."*\\_]/);
  assert.equal(courseSearchFilter(term).split(",").length, 3);
});
