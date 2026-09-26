import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createCatalogPageLoader, retryAfterMilliseconds } from "../scripts/catalog-fetch.mjs";

test("Retry-After supports seconds and HTTP dates", () => {
  const now = Date.parse("2026-09-26T10:00:00Z");
  assert.equal(retryAfterMilliseconds("12", now), 12_000);
  assert.equal(retryAfterMilliseconds("Sat, 26 Sep 2026 10:01:00 GMT", now), 60_000);
  assert.equal(retryAfterMilliseconds(null, now), 0);
});

test("successful pages are cached and not downloaded twice", async t => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "rafiq-catalog-"));
  t.after(() => rm(cacheDirectory, { recursive: true, force: true }));
  let calls = 0;
  const load = createCatalogPageLoader({
    cacheDirectory,
    fetchImpl: async () => { calls += 1; return new Response("study plan"); },
    sleep: async () => {},
    minimumGapMs: 0,
    jitterMs: 0,
  });

  assert.equal(await load("https://example.test/plan"), "study plan");
  assert.equal(await load("https://example.test/plan"), "study plan");
  assert.equal(calls, 1);
});

test("429 responses wait for Retry-After and then retry", async t => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "rafiq-catalog-"));
  t.after(() => rm(cacheDirectory, { recursive: true, force: true }));
  const waits = [];
  let calls = 0;
  const load = createCatalogPageLoader({
    cacheDirectory,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? new Response("slow down", { status: 429, headers: { "Retry-After": "90" } })
        : new Response("study plan");
    },
    sleep: async milliseconds => waits.push(milliseconds),
    minimumGapMs: 0,
    jitterMs: 0,
    logger: { warn() {} },
  });

  assert.equal(await load("https://example.test/rate-limited"), "study plan");
  assert.equal(calls, 2);
  assert.deepEqual(waits, [90_000, 0]);
});

test("optional missing translations are cached as empty pages", async t => {
  const cacheDirectory = await mkdtemp(join(tmpdir(), "rafiq-catalog-"));
  t.after(() => rm(cacheDirectory, { recursive: true, force: true }));
  let calls = 0;
  const load = createCatalogPageLoader({
    cacheDirectory,
    fetchImpl: async () => { calls += 1; return new Response("missing", { status: 404 }); },
    sleep: async () => {},
    minimumGapMs: 0,
    jitterMs: 0,
  });

  assert.equal(await load("https://example.test/missing", { optional: true }), "");
  assert.equal(await load("https://example.test/missing", { optional: true }), "");
  assert.equal(calls, 1);
});
