// Controlled production-SSR benchmark, NOT a live Supabase or browser-vitals test.
// node scripts/performance-smoke.mjs [project-directory] [--baseline]
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const project = resolve(process.argv[2] || process.cwd());
const baseline = process.argv.includes('--baseline');
const latency = 80;
const adminId = 'afc00000-0000-4000-8000-000000000001';
const studentId = 'afc00000-0000-4000-8000-000000000002';
const resourceId = 'afc00000-0000-4000-8000-000000000003';
const courseId = 'afc00000-0000-4000-8000-000000000004';
const collegeId = 'afc00000-0000-4000-8000-000000000005';
const majorId = 'afc00000-0000-4000-8000-000000000008';
const calls = [];
const questionId = 'afc00000-0000-4000-8000-000000000006';
const answerId = 'afc00000-0000-4000-8000-000000000007';
let sequence = 100;
const nextId = () => `afc00000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
const questions = Array.from({ length: 21 }, (_, i) => ({
  id: i === 0 ? questionId : nextId(), title: `QA question ${i} <script>alert(1)</script>`, body: 'How can I trace BFS on this graph?\n<script>alert(1)</script>',
  author_id: studentId, course_id: courseId, created_at: new Date(Date.UTC(2026, 8, 15, 12, 0, i)).toISOString(),
  courses: { name_ar: 'الخوارزميات', name_en: 'Algorithms' }, profiles: { full_name: 'QA Student', username: 'qa_student' },
}));
const answers = Array.from({ length: 21 }, (_, i) => ({
  id: i === 0 ? answerId : nextId(), question_id: questionId, author_id: studentId,
  body: `QA answer ${i}: use a queue.\n<script>alert(1)</script>`, created_at: new Date(Date.UTC(2026, 8, 15, 12, 1, i)).toISOString(), profiles: { full_name: 'QA Student', username: 'qa_student' },
}));
const reports = [];
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
  calls.push({ path: url.pathname, select: url.searchParams.get('select'), id, method: req.method, filteredId: url.searchParams.has('id'), order: url.searchParams.get('order'), offset: url.searchParams.get('offset'), limit: url.searchParams.get('limit'), course: url.searchParams.get('course_id'), search: url.searchParams.get('search_vector'), anonymous: req.headers.authorization === 'Bearer mock-key' && !req.headers.cookie, authorization: req.headers.authorization });
  await new Promise(done => setTimeout(done, latency));
  res.setHeader('content-type', 'application/json');
  const reply = data => res.end(JSON.stringify(data));
  const singleton = data => req.headers.accept?.includes('vnd.pgrst.object') ? data[0] : data;
  if (url.pathname === '/auth/v1/user') return reply({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-09-15T12:00:00Z' });
  if (url.pathname === '/rest/v1/profiles') return reply(singleton([{ id: url.searchParams.get('id')?.replace('eq.', '') || studentId, role: id === adminId ? 'admin' : 'student', full_name: 'QA Student', username: 'qa_student' }]));
  if (url.pathname === '/rest/v1/courses') return reply(singleton([{ id: courseId, major_id: majorId, code: '10671212', slug: 'algorithms', name_ar: 'الخوارزميات', name_en: 'Algorithms' }]));
  if (url.pathname === '/rest/v1/majors') return reply(singleton([{ id: majorId, college_id: collegeId, slug: 'computer-science', name_ar: 'علم الحاسوب', name_en: 'Computer Science' }]));
  if (url.pathname === '/rest/v1/colleges') return reply(singleton([{ id: collegeId, slug: 'engineering', name_ar: 'الهندسة', name_en: 'Engineering' }]));
  if (url.pathname === '/rest/v1/books') return reply([]);
  if (['/rest/v1/questions', '/rest/v1/answers'].includes(url.pathname)) {
    const table = url.pathname.endsWith('/questions') ? questions : answers;
    if (req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body);
      if (!id || payload.author_id !== id) { res.statusCode = 403; return reply({ code: '42501' }); }
      const row = { ...payload, id: nextId(), created_at: '2026-09-16T00:00:00.000Z', courses: payload.course_id ? { name_ar: 'الخوارزميات', name_en: 'Algorithms' } : null, profiles: { full_name: 'QA Student', username: 'qa_student' } };
      table.push(row); return reply(singleton([row]));
    }
    if (req.method === 'PATCH') {
      let body = ''; for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body), target = url.searchParams.get('id')?.replace('eq.', '');
      const row = table.find(item => item.id === target);
      if (!row || !id || (row.author_id !== id && id !== adminId)) { res.statusCode = 200; return reply(singleton([])); }
      Object.assign(row, payload, { updated_at: '2026-09-16T01:00:00.000Z' }); return reply(singleton([row]));
    }
    if (req.method === 'DELETE') {
      const target = url.searchParams.get('id')?.replace('eq.', ''), index = table.findIndex(item => item.id === target);
      const row = table[index];
      if (!row || !id || (row.author_id !== id && id !== adminId)) { res.statusCode = 200; return reply(singleton([])); }
      table.splice(index, 1);
      if (table === questions) for (let i = answers.length - 1; i >= 0; i--) if (answers[i].question_id === row.id) answers.splice(i, 1);
      return reply(singleton([row]));
    }
    let rows = table.filter(row => ['id', 'question_id', 'course_id'].every(key => {
      const filter = url.searchParams.get(key);
      if (!filter) return true;
      if (filter.startsWith('eq.')) return filter === `eq.${row[key]}`;
      if (filter.startsWith('in.(')) return filter.slice(4, -1).split(',').includes(String(row[key]));
      return false;
    }));
    const search = url.searchParams.get('search_vector');
    if (search) rows = rows.filter(row => `${row.title} ${row.body}`.toLowerCase().includes(search.split(').').at(-1).toLowerCase()));
    rows = [...rows].sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
    const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || rows.length);
    return reply(singleton(rows.slice(offset, offset+limit)));
  }
  if (url.pathname === '/rest/v1/reports') {
    if (req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body);
      const source = payload.target_type === 'question' ? questions : answers;
      const target = source.find(item => item.id === payload.target_id);
      if (!id || payload.reporter_id !== id || !target || target.author_id === id) { res.statusCode = 403; return reply({ code: '42501' }); }
      if (reports.some(item => item.reporter_id === id && item.target_type === payload.target_type && item.target_id === payload.target_id && item.status === 'pending')) { res.statusCode = 409; return reply({ code: '23505', message: 'duplicate_pending_report' }); }
      const row = { ...payload, id: nextId(), status: 'pending', created_at: '2026-09-16T01:00:00.000Z' };
      reports.push(row); return reply(singleton([row]));
    }
    if (req.method === 'PATCH') {
      let body = ''; for await (const chunk of req) body += chunk;
      const payload = JSON.parse(body), target = url.searchParams.get('id')?.replace('eq.', '');
      const expected = url.searchParams.get('status')?.replace('eq.', '');
      const row = reports.find(item => item.id === target && item.status === expected);
      if (!row || id !== adminId) return reply(singleton([]));
      Object.assign(row, payload); return reply(singleton([row]));
    }
    let rows = reports.filter(row => !url.searchParams.has('status') || url.searchParams.get('status') === `eq.${row.status}`);
    res.setHeader('content-range', rows.length ? `0-${rows.length-1}/${rows.length}` : '*/0');
    return reply(singleton(rows));
  }
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
  const adminAccount = await visit('/api/account', adminId);
  assert.equal(adminAccount.status, 200);
  assert.ok(adminAccount.body.includes('"isAdmin":true'));
  assert.match(adminAccount.headers['cache-control'] || '', /no-store/);
  const anonymousAccount = await visit('/api/account', null);
  assert.equal(anonymousAccount.status, 200);
  assert.ok(anonymousAccount.body.includes('"account":null'));
  for (const prefix of ['', '/en']) {
    const home = await visit(prefix || '/'); assert.equal(home.status, 200);
    const resources = await visit(`${prefix}/resources?college=${collegeId}&major=${majorId}&course=${courseId}`); assert.equal(resources.status, 200); assert.ok(resources.body.includes('QA resource &lt;script&gt;'));
    const details = await visit(`${prefix}/resources/${resourceId}`); assert.equal(details.status, 200);
    if (!baseline) {
      const resourceCall = calls.filter(c => c.path === '/rest/v1/resources' && c.select?.includes('download_count')).at(-1);
      if (resourceCall) {
        assert.ok(!resourceCall.select.includes('*') && !resourceCall.select.includes('storage_path'));
        assert.equal(resourceCall.anonymous, true, `Public resource reads must not carry a user session: ${JSON.stringify(resourceCall)}`);
      }
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
    const catalogCalls = calls.filter(c => /\/(colleges|courses)$/.test(c.path) && !c.filteredId && c.order && ['id,name_ar', 'id,name_ar,name_en'].includes(c.select?.replace(/\s/g, '')));
    assert.ok(catalogCalls.every(c => c.anonymous), 'Shared catalog reads must never carry a session');
    assert.equal(calls.slice(studentUploadStart).filter(c => /\/(colleges|courses)$/.test(c.path)).length, 0, 'The public cache is reusable, unlike session data');
  }
  const anonymous = await visit('/en/resources/new', null);
  assert.ok((anonymous.headers.location || anonymous.body).includes('/auth/login'));
  assert.ok(!anonymous.body.includes('afc00000-0000-4000-8000-000000000004'));
  if (!baseline) {
    const manifest = JSON.parse(await readFile(resolve(project, '.next/server/server-reference-manifest.json'), 'utf8'));
    const { encodeReply } = createRequire(resolve(project, 'package.json'))('next/dist/compiled/react-server-dom-turbopack/client.node.js');
    async function action(path, name, input, user) {
      const entry = Object.entries(manifest.node).find(([, info]) => info.exportedName === name);
      assert.ok(entry, `Missing compiled action ${name}`);
      const body = await encodeReply([input]);
      assert.equal(typeof body, 'string', 'Fixture inputs must use simple Flight JSON');
      return new Promise((done, fail) => {
        const req = request(`http://localhost:4100${path}`, { method: 'POST', headers: { ...(user ? { cookie: cookie(user) } : {}), 'Next-Action': entry[0], accept: 'text/x-component', origin: 'http://localhost:4100', 'content-type': 'text/plain;charset=UTF-8' } }, res => {
          let response = ''; res.on('data', b => response += b); res.on('end', () => done({ status: res.statusCode, body: response }));
        }); req.setTimeout(15000, () => req.destroy(Error('Action check timed out'))); req.on('error', fail); req.end(body);
      });
    }
    for (const prefix of ['', '/en']) {
      const start = calls.length;
      const list = await visit(`${prefix}/questions`, null); assert.equal(list.status, 200);
      assert.ok(list.body.includes('&lt;script&gt;') && list.body.includes(prefix ? 'Ask a question' : 'اطرح سؤالًا'));
      const listQueries = calls.slice(start).filter(c => c.path === '/rest/v1/questions');
      assert.ok(listQueries.length <= 1, 'A public question list should query at most once before entering the shared cache');
      if (listQueries[0]) assert.equal(listQueries[0].limit, '21');
      const filtered = await visit(`${prefix}/questions?q=BFS&course=${courseId}&page=2`, null); assert.equal(filtered.status, 200);
      const query = calls.slice(start).filter(c => c.path === '/rest/v1/questions' && c.offset === '20').at(-1);
      if (query) {
        assert.equal(query.course, `eq.${courseId}`); assert.ok(query.search.startsWith('wfts(simple).'));
      }
      const missingSearch = await visit(`${prefix}/questions?q=absent-fixture-term`, null);
      assert.ok(missingSearch.body.includes(prefix ? 'No matching questions' : 'لا توجد أسئلة'));
      const details = await visit(`${prefix}/questions/${questionId}`, studentId); assert.equal(details.status, 200);
      assert.ok(details.body.includes('QA answer') && details.body.includes('&lt;script&gt;') && details.body.includes('name="body"'));
      const answerPage = await visit(`${prefix}/questions/${questionId}?page=2`, null); assert.equal(answerPage.status, 200);
      assert.ok(answerPage.body.includes('QA answer 0') && answerPage.body.includes(prefix ? 'Sign in to add an answer' : 'سجّل دخولك لتضيف إجابة'));
      assert.ok(!answerPage.body.includes('name="body"'));
      const newPage = await visit(`${prefix}/questions/new`, studentId); assert.equal(newPage.status, 200);
      assert.ok(newPage.body.includes('name="title"') && newPage.body.includes(prefix ? 'Question details' : 'تفاصيل السؤال'));
      assert.ok(!newPage.body.includes('passwordMismatch'));
      const denied = await visit(`${prefix}/questions/new`, null);
      assert.ok((denied.headers.location || denied.body).includes(`${prefix}/auth/login`));
      assert.ok(!denied.body.includes('name="title"'));
    }
    const beforeInvalid = questions.length;
    const invalid = await action('/en/questions/new', 'createQuestion', { title: 'x', body: '' }, studentId);
    assert.ok(invalid.body.includes('"error":"invalid"')); assert.equal(questions.length, beforeInvalid);
    const unauthorized = await action('/en/questions/new', 'createQuestion', { title: 'Unauthorized test', body: 'This must not create a post.' }, null);
    assert.ok(unauthorized.body.includes('"error":"unauthorized"')); assert.equal(questions.length, beforeInvalid);
    const posted = await action('/en/questions/new', 'createQuestion', { title: 'HTTP posted question <script>', body: 'Can I use a queue here? <script>alert(1)</script>', course_id: courseId, author_id: adminId }, studentId);
    assert.equal(posted.status, 200); assert.ok(posted.body.includes('"success":true'));
    const row = questions.at(-1); assert.equal(row.author_id, studentId); assert.equal(questions.length, beforeInvalid+1);
    const beforeAnswer = answers.length;
    const deniedAnswer = await action(`/en/questions/${row.id}`, 'createAnswer', { question_id: row.id, body: 'Unauthenticated answer' }, null);
    assert.ok(deniedAnswer.body.includes('"error":"unauthorized"')); assert.equal(answers.length, beforeAnswer);
    const postedAnswer = await action(`/en/questions/${row.id}`, 'createAnswer', { question_id: row.id, body: 'HTTP posted answer <script>alert(1)</script>', author_id: adminId }, studentId);
    assert.equal(postedAnswer.status, 200); assert.ok(postedAnswer.body.includes('"success":true'));
    assert.equal(answers.at(-1).author_id, studentId); assert.equal(answers.length, beforeAnswer+1);
    const publicRead = await visit(`/en/questions/${row.id}`, null);
    assert.ok(publicRead.body.includes('HTTP posted answer &lt;script&gt;') && publicRead.body.includes('HTTP posted question &lt;script&gt;'));
    const deniedEdit = await action(`/en/questions/${row.id}`, 'updateAnswer', { answer_id: answers.at(-1).id, body: 'Anonymous edit' }, null);
    assert.ok(deniedEdit.body.includes('"error":"unauthorized"'));
    const editedQuestion = await action(`/en/questions/${row.id}/edit`, 'updateQuestion', { question_id: row.id, title: 'Edited HTTP question', body: 'Edited question body remains sufficiently detailed.', course_id: null, author_id: adminId }, studentId);
    assert.ok(editedQuestion.body.includes('"success":true')); assert.equal(row.title, 'Edited HTTP question'); assert.equal(row.author_id, studentId);
    const editedAnswerId = answers.at(-1).id;
    const editedAnswer = await action(`/en/questions/${row.id}`, 'updateAnswer', { answer_id: editedAnswerId, body: 'Edited HTTP answer', author_id: adminId }, studentId);
    assert.ok(editedAnswer.body.includes('"success":true')); assert.equal(answers.find(item => item.id === editedAnswerId).body, 'Edited HTTP answer');
    const report = await action(`/en/questions/${row.id}`, 'reportForumPost', { target_type: 'question', target_id: row.id, reason: 'Moderator should inspect this fixture', reporter_id: studentId }, adminId);
    assert.ok(report.body.includes('"success":true')); assert.equal(reports.at(-1).reporter_id, adminId); assert.equal(reports.at(-1).status, 'pending');
    const duplicateReport = await action(`/en/questions/${row.id}`, 'reportForumPost', { target_type: 'question', target_id: row.id, reason: 'Duplicate fixture report' }, adminId);
    assert.ok(duplicateReport.body.includes('"error":"duplicate"'));
    const reportDashboard = await visit('/en/dashboard/reports', adminId); assert.equal(reportDashboard.status, 200);
    assert.ok(reportDashboard.body.includes('Moderator should inspect this fixture') && reportDashboard.body.includes('Edited HTTP question'));
    const reviewed = await action('/en/dashboard/reports', 'moderateReport', { reportId: reports.at(-1).id, expectedStatus: 'pending', status: 'reviewed' }, adminId);
    assert.ok(reviewed.body.includes('"success":true')); assert.equal(reports.at(-1).status, 'reviewed');
    const removedAnswer = await action(`/en/questions/${row.id}`, 'deleteForumPost', { target_type: 'answer', target_id: editedAnswerId }, adminId);
    assert.ok(removedAnswer.body.includes('"success":true')); assert.equal(answers.some(item => item.id === editedAnswerId), false);
    const removedQuestion = await action(`/en/questions/${row.id}`, 'deleteForumPost', { target_type: 'question', target_id: row.id }, studentId);
    assert.ok(removedQuestion.body.includes('"success":true')); assert.equal(questions.some(item => item.id === row.id), false);
    const missing = await visit('/en/questions/afc00000-0000-4000-8000-999999999999', null);
    assert.ok(missing.status === 404 || missing.body.includes('noindex'));
    const malformed = await visit('/en/questions/not-a-guid', null);
    assert.ok(malformed.status === 404 || malformed.body.includes('noindex'));
    console.log('PASS: Arabic/English Q&A pages, filters, verified CRUD/report actions, admin review, public reads and escaped bodies');
  }
  console.log(JSON.stringify(metrics, null, 2));
  console.log('PASS: Arabic/English SSR, translated forms, escaped titles, admin/student isolation and anonymous upload redirect');
  if (!baseline) console.log('PASS: warm catalog cache, scoped client messages and lean resource details');
} catch (error) {
  console.error(error.stack, logs.slice(-3000)); process.exitCode = 1;
} finally {
  if (app && app.exitCode === null) { const exited = new Promise(done => app.once('exit', done)); app.kill('SIGTERM'); await exited; }
  mock.close();
}
