import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/[locale]/books/page.tsx', import.meta.url), 'utf8');

test('book market is server-rendered, bounded, searchable and filterable', () => {
  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /\.eq\("status", "available"\)/);
  assert.match(page, /\.limit\(60\)/);
  assert.match(page, /\.ilike\("title"/);
  assert.match(page, /\.eq\("college_id", collegeId\)/);
  assert.match(page, /\.eq\("type", type\)/);
  assert.doesNotMatch(page, /select\(["'`]\*["'`]\)/);
});

test('book market has a responsive premium UI and safe WhatsApp links', () => {
  for (const marker of ['marketBadge', 'allColleges', 'applyFilters', 'recentlyAdded', 'availableCount']) assert.match(page, new RegExp(marker));
  assert.match(page, /phone\.replace\(\/\\D\/g, ""\)/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /md:grid-cols-2 xl:grid-cols-3/);
  assert.match(page, /Book market unavailable/);
});
