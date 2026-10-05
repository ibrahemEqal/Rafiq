// Invoked by performance-smoke.mjs with RAFIQ_BROWSER_TESTS=1.
// PLAYWRIGHT_MODULE may point to an externally installed Playwright module.
import assert from 'node:assert/strict';

export async function runCatalogUiSmoke(base, ids) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundledBrowser = process.env.CHROMIUM_MODULE ? (await import(process.env.CHROMIUM_MODULE)).default : null;
  const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || (bundledBrowser ? await bundledBrowser.executablePath() : undefined);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath, args: bundledBrowser?.args ?? [] } : {}) });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const visitedApi = [];
    page.on('request', request => { if (request.url().includes('/api/catalog')) visitedApi.push(request.url()); });
    for (const path of ['/en/questions', '/en/requests']) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      const scope = page.getByLabel('Course category', { exact: true });
      await scope.waitFor();
      assert.equal(await page.locator('select option').count(), 3, 'No thousand-course dropdown on initial render');
      assert.equal(visitedApi.length, 0, 'No catalog HTTP calls until a category/parent is chosen');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/ar/books', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('article').count(), 2, 'Book and printed-slide listings render as complete market cards');
    assert.equal(await page.getByRole('link', { name: 'تواصل واتساب', exact: true }).count(), 2);
    await page.getByRole('option', { name: 'كل الكليات', exact: true }).waitFor({ state: 'attached' });
    assert.ok(await page.getByText('اعثر على نسختك التالية', { exact: true }).isVisible());
    if (process.env.RAFIQ_BOOKS_SCREENSHOT_PATH) await page.screenshot({ path: process.env.RAFIQ_BOOKS_SCREENSHOT_PATH, fullPage: true });
    await page.goto(base + '/en/requests', { waitUntil: 'networkidle' });
    await page.getByLabel('Course category', { exact: true }).selectOption('major');
    await page.getByLabel('College', { exact: true }).selectOption(ids.collegeId);
    await page.getByRole('option', { name: 'Computer Science', exact: true }).waitFor({ state: 'attached' });
    await page.getByLabel('Major', { exact: true }).selectOption(ids.majorId);
    await page.getByRole('option', { name: '10671212 — Algorithms', exact: true }).waitFor({ state: 'attached' });
    await page.getByLabel('Course and code', { exact: true }).selectOption(ids.courseId);
    assert.equal(await page.locator('select[name="course"] option').count(), 2);
    await page.getByLabel('Major', { exact: true }).selectOption(ids.secondMajorId);
    assert.equal(await page.locator('select[name="course"]').inputValue(), '', 'Changing the parent clears the old course immediately');
    await page.getByLabel('Course category', { exact: true }).selectOption('university');
    await page.getByLabel('University requirement', { exact: true }).selectOption('arabic-language');
    await page.getByRole('option', { name: '11000102 — Arabic Language', exact: true }).waitFor({ state: 'attached' });
    assert.equal(await page.locator('select[name="course"] option').count(), 2, 'One Arabic entry despite multiple majors');
    await page.getByLabel('Course and code', { exact: true }).selectOption(ids.arabicId);

    // Deliberately return an old, slow response after a newer selection.
    await page.route('**/api/catalog?requirement=english-102', async route => {
      await new Promise(done => setTimeout(done, 250));
      await route.continue().catch(() => {});
    });
    await page.getByLabel('University requirement', { exact: true }).selectOption('english-102');
    assert.equal(await page.locator('select[name="course"]').inputValue(), '');
    await page.getByLabel('University requirement', { exact: true }).selectOption('arabic-language');
    await page.getByRole('option', { name: '11000102 — Arabic Language', exact: true }).waitFor({ state: 'attached' });
    await page.waitForTimeout(350);
    assert.equal(await page.getByRole('option', { name: /English Language II/ }).count(), 0, 'Aborted response must not overwrite the latest selection');
    await page.unroute('**/api/catalog?requirement=english-102');
    await page.getByLabel('University requirement', { exact: true }).selectOption('english-102');
    await page.getByRole('option', { name: '11000323 — English Language II — Faculty of Humanities and Educational Sciences', exact: true }).waitFor({ state: 'attached' });
    assert.equal(await page.locator('select[name="course"] option').count(), 3, 'Different course codes stay distinguishable');

    // Explicit retry without losing other form fields.
    let failedOnce = false;
    await page.route('**/api/catalog?requirement=arabic-language', async route => {
      if (!failedOnce) { failedOnce = true; return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }); }
      return route.continue();
    });
    await page.getByLabel('University requirement', { exact: true }).selectOption('arabic-language');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('option', { name: '11000102 — Arabic Language', exact: true }).waitFor({ state: 'attached' });
    await page.unroute('**/api/catalog?requirement=arabic-language');

    await page.goto(`${base}/en/questions?course=${ids.oldArabicId}`, { waitUntil: 'networkidle' });
    await page.getByRole('option', { name: '11000102 — Arabic Language', exact: true }).waitFor({ state: 'attached' });
    assert.equal(await page.locator('select[name="course"]').inputValue(), ids.oldArabicId, 'Old selected IDs are preserved');
    assert.equal(await page.locator('select[name="course"] option').count(), 2, 'No duplicate selected option');

    // Logged-in upload: required selection, correct hidden college, no storage writes.
    const [cookieName, ...cookieValue] = ids.cookie.split('=');
    await context.addCookies([{ name: cookieName, value: cookieValue.join('='), url: base }]);
    await page.goto(base + '/en/resources/new', { waitUntil: 'networkidle' });
    await page.getByLabel('Course category', { exact: true }).selectOption('university');
    await page.getByLabel('University requirement', { exact: true }).selectOption('arabic-language');
    await page.getByRole('option', { name: '11000102 — Arabic Language', exact: true }).waitFor({ state: 'attached' });
    assert.equal(await page.locator('select[name="course_id"]').evaluate(element => element.checkValidity()), false);
    await page.getByLabel('Course and code', { exact: true }).selectOption(ids.arabicId);
    assert.equal(await page.locator('input[name="college_id"]').inputValue(), ids.collegeId);
    await page.getByLabel('Course category', { exact: true }).selectOption('major');
    assert.equal(await page.locator('input[name="college_id"]').inputValue(), '', 'Switching scope clears the stale upload parent');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/ar/questions', { waitUntil: 'networkidle' });
    await page.getByLabel('نوع المساق', { exact: true }).selectOption('university');
    await page.getByLabel('متطلب الجامعة', { exact: true }).selectOption('english-102');
    await page.getByRole('option', { name: /11000323/ }).waitFor({ state: 'attached' });
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No mobile horizontal overflow');
    if (process.env.RAFIQ_SCREENSHOT_PATH) {
      await page.locator('form[method="get"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: process.env.RAFIQ_SCREENSHOT_PATH });
    }
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('PASS: browser lazy loading, AR/EN, mobile RTL, required uploads, old IDs, parent resets, race cancellation and retry');
  } finally { await browser.close(); }
}
