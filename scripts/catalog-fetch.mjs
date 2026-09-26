import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const defaultSleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function retryAfterMilliseconds(value, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

export function createCatalogPageLoader({
  cacheDirectory,
  fetchImpl = globalThis.fetch,
  refresh = false,
  sleep = defaultSleep,
  random = Math.random,
  now = Date.now,
  minimumGapMs = 900,
  jitterMs = 300,
  maximumAttempts = 8,
  logger = console,
}) {
  if (!cacheDirectory) throw new Error("cacheDirectory is required");
  if (typeof fetchImpl !== "function") throw new Error("fetch is not available");

  const ready = mkdir(cacheDirectory, { recursive: true });
  let queue = Promise.resolve();

  const jitter = () => Math.floor(random() * (jitterMs + 1));
  const coolDown = () => sleep(minimumGapMs + jitter());

  async function save(cacheFile, contents) {
    const temporaryFile = `${cacheFile}.${process.pid}.tmp`;
    await writeFile(temporaryFile, contents, "utf8");
    await rename(temporaryFile, cacheFile);
  }

  async function load(url, { optional = false } = {}) {
    await ready;
    const cacheFile = join(cacheDirectory, `${createHash("sha256").update(url).digest("hex")}.html`);

    if (!refresh) {
      try {
        return await readFile(cacheFile, "utf8");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }

    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(url, {
          headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": "Rafiq academic catalog importer (educational; one request at a time)",
          },
          signal: AbortSignal.timeout(30_000),
        });
      } catch (error) {
        if (attempt === maximumAttempts) {
          throw new Error(`Network error after ${maximumAttempts} attempts: ${url}`, { cause: error });
        }
        const waitMs = Math.min(5_000 * (2 ** (attempt - 1)), 60_000) + jitter();
        logger.warn(`Network error; retrying ${url} in ${Math.ceil(waitMs / 1_000)}s (${attempt}/${maximumAttempts}).`);
        await sleep(waitMs);
        continue;
      }

      if (response.ok) {
        const contents = await response.text();
        await save(cacheFile, contents);
        await coolDown();
        return contents;
      }

      if (response.status === 404 && optional) {
        await save(cacheFile, "");
        await coolDown();
        return "";
      }

      const retryAfter = retryAfterMilliseconds(response.headers.get("retry-after"), now());
      const retryable = response.status === 408
        || response.status === 425
        || response.status === 429
        || response.status >= 500
        || (response.status === 403 && retryAfter > 0);

      if (!retryable || attempt === maximumAttempts) {
        throw new Error(`${response.status}: ${url}`);
      }

      const fallback = response.status === 429
        ? Math.min(30_000 * (2 ** (attempt - 1)), 300_000)
        : Math.min(5_000 * (2 ** (attempt - 1)), 60_000);
      const waitMs = Math.max(retryAfter, fallback) + jitter();
      const reason = response.status === 429 ? "Rate limited" : `HTTP ${response.status}`;
      logger.warn(`${reason}; retrying ${url} in ${Math.ceil(waitMs / 1_000)}s (${attempt}/${maximumAttempts}).`);
      await sleep(waitMs);
    }

    throw new Error(`Unable to fetch ${url}`);
  }

  return function loadPage(url, options) {
    const result = queue.then(() => load(url, options));
    queue = result.catch(() => undefined);
    return result;
  };
}
