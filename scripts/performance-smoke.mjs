// Controlled production-SSR benchmark, NOT a live Supabase or browser-vitals test.
// node scripts/performance-smoke.mjs [project-directory] [--baseline]
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';

const project = resolve(process.argv[2] || process.cwd());
const baseline = process.argv.includes('--baseline');
const latency = 80;
const adminId = 'afc00000-0000-4000-8000-000000000001';
const studentId = 'afc00000-0000-4000-8000-000000000002';
const resourceId = 'afc00000-0000-4000-8000-000000000003';
const courseId = 'afc00000-0000-4000-8000-000000000004';
const collegeId = 'afc00000-0000-4000-8000-000000000005';
const calls = [];
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function cookie(id) {
  const now = Math.floor(Date.now()/1000);
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, email: `${id}@example.invalid`, role: 'authenticated', aud: 'authenticated', exp: now+3600, iat: now })}.mock-signature`;
  return `sb-127-auth-token=base64-${encode({ access_token: token, refresh_token: 'mock', expires_at: now+3600, expires_in: 3600, token_type: 'bearer', user: { id, email: `${id}@example.invalid` } })}`;
}
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:54329');
  let id;
  try { id = JSON.parse(Buffer.from(req.headers.authorization.split(' ')[1].split('.')[1], 'base64url')).sub; } catch {}
  calls.push({ path: url.pathname, select: url.searchParams.get('select'), id, method: req.method, anonymous: req.headers.authorization === 'Bearer mock-key' && !req.headers.cookie });
  await new Promise(done => setTimeout(done, latency));
  res.setHeader('content-type', 'application/json');
  const reply = data => res.end(JSON.stringify(data));
  const singleton = data => req.headers.accept?.includes('vnd.pgrst.object') ? data[0] : data;
  if (url.pathname === '/auth/v1/user') return reply({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-09-15T12:00:00Z' });
  if (url.pathname === '/rest/v1/profiles') return reply(singleton([{ id: url.searchParams.get('id')?.replace('eq.', '') || studentId, role: id === adminId ? 'admin' : 'student', full_name: 'QA Student', username: 'qa_student' }]));
  if (url.pathname === '/rest/v1/courses') return reply([{ id: courseId, name_ar: 'الخوارزميات', name_en: 'Algorithms' }]);
  if (url.pathname === '/rest/v1/colleges') return reply([{ id: collegeId, name_ar: 'الهندسة', name_en: 'Engineering' }]);
  if (url.pathname === '/rest/v1/books') return reply([]);
  if (url.pathname === '/rest/v1/resources') {
    const row = { id: resourceId, title: 'QA resource <script>alert(1)</script>', type: 'summary', status: url.searchParams.get('status')?.replace('eq.', '') || 'approved', file_size: 1024, download_count: 0, view_count: 0, created_at: '2026-09-15T12:00:00Z', course_id: courseId, uploader_id: studentId, courses: { name_ar: 'الخوارزميات', name_en: 'Algorithms' }, profiles: { full_name: 'QA Student' } };
    res.setHeader('content-range', '0-0/1');
    return reply(singleton([row]));
  }
  res.statusCode = 404; return reply({ message: 'Unknown mock endpoint' });
});
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key', NEXT_PUBLIC_SITE_URL: 'http://localhost:4100', NEXT_TELEMETRY_DISABLED: '1' };
function runBuild() {
  return new Promise((done, fail) => {
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = ''; child.stdout.on('data', b => log += b); child.stderr.on('data', b => log += b);
    child.once('error', fail); child.once('exit', code => code === 0 ? done() : fail(new Error(log)));
  });
}
function visit(path, user = adminId) {
  const start = performance.now();
  return new Promise((done, fail) => {
    const req = request(`http://localhost:4100${path}`, { headers: { ...(user ? { cookie: cookie(user) } : {}), 'accept-encoding': 'identity', 'user-agent': 'Mozilla/5.0 PerformanceSmoke' } }, res => {
      let body = '', firstByteMs, mainReadyMs;
      const marker = path.endsWith('/resources/new') ? 'name="course_id"' : '<h1';
      res.on('data', b => {
        firstByteMs ??= performance.now()-start;
        body += b;
        if (body.includes(marker)) mainReadyMs ??= performance.now()-start;
      });
      res.on('end', () => done({ status: res.statusCode, headers: res.headers, body, firstByteMs, mainReadyMs, completeMs: performance.now()-start, htmlBytes: Buffer.byteLength(body), gzipBytes: gzipSync(body).length }));
    }); req.setTimeout(15000, () => req.destroy(new Error('Local HTTP check timed out'))); req.on('error', fail); req.end();
  });
}
const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length/2)];
const rounded = value => Math.round(value*10)/10;
let app, logs = '';
try {
  await new Promise(done => mock.listen(54329, '127.0.0.1', done));
  await runBuild();
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', 'localhost', '--port', '4100'], { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'] });
  app.stdout.on('data', b => logs += b); app.stderr.on('data', b => logs += b);
  await new Promise((done, fail) => {
    const timer = setTimeout(() => fail(new Error('Readiness timeout: '+logs)), 20000);
    const check = () => { if (logs.includes('Ready in')) { clearTimeout(timer); done(); } };
    app.stdout.on('data', check); app.stderr.on('data', check);
    app.once('error', fail); app.once('exit', code => { clearTimeout(timer); fail(new Error('App exited '+code+' '+logs)); });
  });
  const metrics = { fixtureLatencyMs: latency, samplesPerRoute: 5, mode: baseline ? 'baseline' : 'optimized', routes: {} };
  for (const path of ['/en', '/en/resources/new']) {
    const first = await visit(path); assert.equal(first.status, 200);
    const samples = [];
    for (let i=0; i<5; i++) {
      const before = calls.length;
      const sample = await visit(path); assert.equal(sample.status, 200);
      assert.ok(Number.isFinite(sample.mainReadyMs), 'Main HTML marker must actually render');
      samples.push({ ...sample, calls: calls.slice(before) });
    }
    metrics.routes[path] = {
      firstByteMedianMs: rounded(median(samples.map(s => s.firstByteMs))),
      mainHtmlReadyMedianMs: rounded(median(samples.map(s => s.mainReadyMs))),
      completeMedianMs: rounded(median(samples.map(s => s.completeMs))),
      htmlBytesMedian: median(samples.map(s => s.htmlBytes)), gzipBytesMedian: median(samples.map(s => s.gzipBytes)),
      upstreamRequestsMedian: median(samples.map(s => s.calls.length)),
      warmCatalogRequests: samples.flatMap(s => s.calls).filter(c => /\/(colleges|courses)$/.test(c.path)).length,
    };
    if (!baseline) {
      assert.ok(!first.body.includes('Your Companion in the University Journey') || path === '/en');
      assert.ok(!first.body.includes('passwordMismatch'), 'Unrelated Auth messages must not be serialized');
      if (path.endsWith('/new')) {
        assert.equal(metrics.routes[path].warmCatalogRequests, 0, 'Warm public catalog should not refetch');
        assert.ok(first.body.includes('Select Course'), 'Upload translations must render');
      }
    }
  }
  for (const prefix of ['', '/en']) {
    const home = await visit(prefix || '/'); assert.equal(home.status, 200);
    const resources = await visit(`${prefix}/resources`); assert.equal(resources.status, 200); assert.ok(resources.body.includes('QA resource &lt;script&gt;'));
    const details = await visit(`${prefix}/resources/${resourceId}`); assert.equal(details.status, 200);
    if (!baseline) {
      const select = calls.filter(c => c.path === '/rest/v1/resources').at(-1).select;
      assert.ok(!select.includes('*') && !select.includes('storage_path'));
      assert.ok(details.body.includes(prefix ? 'Algorithms' : 'الخوارزميات'));
    }
    const book = await visit(`${prefix}/books/new`); assert.equal(book.status, 200);
    assert.ok(book.body.includes(prefix ? 'WhatsApp Number' : 'واتساب'));
    const dashboard = await visit(`${prefix}/dashboard`); assert.equal(dashboard.status, 200);
    assert.ok(dashboard.body.includes(prefix ? 'Approve and publish' : 'موافقة ونشر'));
  }
  const before = calls.length;
  const student = await visit('/en/dashboard', studentId);
  assert.ok(!student.body.includes('QA resource &lt;script&gt;'));
  assert.ok(student.status === 404 || student.body.includes('noindex'));
  assert.equal(calls.slice(before).some(c => c.path === '/rest/v1/resources'), false);
  const studentUploadStart = calls.length;
  const studentUpload = await visit('/en/resources/new', studentId);
  assert.equal(studentUpload.status, 200);
  assert.ok(studentUpload.body.includes(studentId) && !studentUpload.body.includes(adminId), 'Session data must never cross users');
  if (!baseline) {
    // Dashboard course metadata also uses this table, but is deliberately an
    // uncached session query. Only public name/ID dropdown reads are shared.
    const catalogCalls = calls.filter(c => /\/(colleges|courses)$/.test(c.path) && c.select?.replace(/\s/g, '') === 'id,name_ar');
    assert.ok(catalogCalls.every(c => c.anonymous), 'Shared catalog reads must never carry a session');
    assert.equal(calls.slice(studentUploadStart).filter(c => /\/(colleges|courses)$/.test(c.path)).length, 0, 'The public cache is reusable, unlike session data');
  }
  const anonymous = await visit('/en/resources/new', null);
  assert.ok((anonymous.headers.location || anonymous.body).includes('/auth/login'));
  assert.ok(!anonymous.body.includes('afc00000-0000-4000-8000-000000000004'));
  console.log(JSON.stringify(metrics, null, 2));
  console.log('PASS: Arabic/English SSR, translated forms, escaped titles, admin/student isolation and anonymous upload redirect');
  if (!baseline) console.log('PASS: warm catalog cache, scoped client messages and lean resource details');
} catch (error) {
  console.error(error.stack, logs.slice(-3000)); process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) { const exited = new Promise(done => app.once('exit', done)); app.kill('SIGTERM'); await exited; }
  mock.close();
}
