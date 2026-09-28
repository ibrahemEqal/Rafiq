import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCatalogPages, CATALOG_PAGE_SIZE } from '../lib/catalog/pagination.ts';
import { NAJAH_SLUG, universityRequirements, universityRequirementCodes, requirementForCode, getUniversityRequirement } from '../lib/catalog/university-requirements.ts';

test('the nine requested requirements are separate, with no duplicate codes', () => {
  assert.equal(universityRequirements.length, 9);
  assert.equal(new Set(universityRequirementCodes).size, universityRequirementCodes.length);
  assert.equal(new Set(universityRequirements.map(item => item.key)).size, 9);
  for (const item of universityRequirements) for (const code of item.codes) {
    assert.equal(requirementForCode(code, NAJAH_SLUG), item);
    assert.equal(getUniversityRequirement(item.key), item);
  }
});

test('university groups do not silently absorb other universities or specialized names', () => {
  assert.equal(requirementForCode('11000102', 'another-university'), undefined);
  // Medical Arabic, medical Islamic Culture, advanced medical English and AI
  // stay in their own curricula; shared-looking names are not enough to merge.
  for (const code of ['11000113', '11000115', '11000320', '11000128', '11000129', '10211101']) {
    assert.equal(requirementForCode(code, NAJAH_SLUG), undefined);
  }
  assert.equal(getUniversityRequirement('anything'), undefined);
  assert.equal(getUniversityRequirement(), undefined);
});

test('English 102 navigation groups all imported variants but preserves their codes', () => {
  const item = getUniversityRequirement('english-102');
  assert.equal(item.codes.length, 9);
  assert.ok(item.codes.includes('11000322') && item.codes.includes('11000330'));
});

for (const count of [0, 1, 199, 200, 201, 1000, 1243]) {
  test(`scoped catalog paging retrieves all ${count} rows without a 1000-row cutoff`, async () => {
    const rows = Array.from({ length: count }, (_, id) => ({ id })), calls = [];
    const result = await readCatalogPages(async (from, to) => {
      calls.push([from, to]);
      assert.equal(to - from + 1, CATALOG_PAGE_SIZE);
      return { data: rows.slice(from, to + 1), error: null };
    });
    assert.deepEqual(result, rows);
    assert.equal(calls.length, Math.floor(count / CATALOG_PAGE_SIZE) + 1);
  });
}

test('upstream errors never become an apparently empty catalog', async () => {
  await assert.rejects(readCatalogPages(async () => ({ data: null, error: { message: 'private detail' } })), /Academic catalog unavailable/);
});

test('no page or form fetches the complete course table anymore', () => {
  for (const path of ['questions/page.tsx', 'requests/page.tsx', 'questions/new/page.tsx', 'requests/new/page.tsx', 'questions/[id]/edit/page.tsx']) {
    const source = readFileSync(new URL(`../app/[locale]/${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /getCourses\(\)/);
  }
});

test('catalog migration is additive, code-based and invoker-RLS protected', () => {
  const source = readFileSync(new URL('../supabase/migrations/20260928210000_shared_course_catalog.sql', import.meta.url), 'utf8');
  assert.equal((source.match(/security_invoker = true/g) ?? []).length, 2);
  assert.match(source, /distinct on \(university_id, code\)/);
  assert.doesNotMatch(source, /\b(delete from|truncate|disable trigger|disable row level security)\b/i);
});
