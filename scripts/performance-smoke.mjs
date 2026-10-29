// Controlled production-SSR benchmark, NOT a live Supabase or browser-vitals test.
// node scripts/performance-smoke.mjs [project-directory] [--baseline]
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { runInNewContext } from 'node:vm';
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
const companionSections = [];
let bulkApprovals = 0;
const adminEditorRow = {id: resourceId, version: 'a'.repeat(32), values: {title:'Editable resource <script>alert(1)</script>',description:'Imported resource description',type:'summary',external_url:'https://drive.google.com/file/d/fixture/view',source_type:'external',status:'pending',course_id:courseId,_course_name_ar:'الخوارزميات',_course_name_en:'Algorithms'}};
const campusCircles = [];
const circleReports = [];

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
const recoveryRequests = [];
const passwordUpdates = [];
const signupRequests = [];
const marketBooks = Array.from({ length: 14 }, (_, index) => ({
  id: `afc00000-0000-4000-8000-${String(index + 600).padStart(12, '0')}`,
  title: index === 0 ? 'Calculus 1 — حساب التفاضل والتكامل' : index === 1 ? 'Printed network notes' : `University textbook ${index}`,
  description: 'نسخة نظيفة، متاحة للاستلام داخل الجامعة. <script>alert(1)</script>',
  type: index === 1 ? 'printed_slides' : 'book', college_id: collegeId,
  whatsapp_number: '0599123456', status: 'available',
  created_at: new Date(Date.UTC(2026, 9, 22, 12, 0, 59 - index)).toISOString(),
  colleges: { name_ar: 'الهندسة', name_en: 'Engineering' },
}));
const ownStudyId = 'afc00000-0000-4000-8000-000000002000';
const sharedStudyId = 'afc00000-0000-4000-8000-000000002001';
const sharedStudyToken = 'afc00000-0000-4000-8000-000000002101';
const studySets = [
  { id: ownStudyId, owner_id: studentId, title: 'Networks — midterm', subject: 'Computer Networks', description: 'Private study notes', visibility: 'private', share_token: 'afc00000-0000-4000-8000-000000002100', updated_at: '2026-10-23T10:00:00Z' },
  { id: sharedStudyId, owner_id: adminId, title: 'Shared TCP revision', subject: 'Computer Networks', description: 'Read-only shared set', visibility: 'shared', share_token: sharedStudyToken, updated_at: '2026-10-23T10:00:00Z' },
];
const studyCards = [
  { id: 'afc00000-0000-4000-8000-000000002200', set_id: ownStudyId, front: 'How do TCP and UDP differ?', back: 'TCP is reliable. UDP sends datagrams. <script>alert(1)</script>' },
  { id: 'afc00000-0000-4000-8000-000000002201', set_id: ownStudyId, front: 'What is DNS?', back: 'Domain Name System.' },
  { id: 'afc00000-0000-4000-8000-000000002202', set_id: sharedStudyId, front: 'What is a TCP handshake?', back: 'SYN, SYN-ACK, ACK.' },
];
const studyMaterials = [{ id: 'afc00000-0000-4000-8000-000000002300', set_id: ownStudyId, title: 'Network lecture notes', url: 'https://example.com/networks' }];
const studyReviews = [];
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
  if (url.pathname.startsWith('/rest/v1/rpc/admin_')) {
    if(id!==adminId){res.statusCode=403;return reply({code:'42501'});}
    let body='';for await(const chunk of req)body+=chunk;
    const input=body?JSON.parse(body):{};
    if(url.pathname.endsWith('/admin_approve_pending_resources')){bulkApprovals++;return reply(1107);}
    if(url.pathname.endsWith('/admin_content_list'))return reply({rows:input.entity==='resources'?[adminEditorRow]:[],total:input.entity==='resources'?1:0});
    if(url.pathname.endsWith('/admin_content_mutate'))return reply({success:true});
  }
  if (url.pathname === '/rest/v1/curated_resources') {
    res.statusCode=404;return reply({code:'PGRST205'});
  }
  if (url.pathname === '/auth/v1/recover') {
    let body = ''; for await (const chunk of req) body += chunk;
    recoveryRequests.push({ ...JSON.parse(body), redirectTo: url.searchParams.get('redirect_to') });
    return reply({});
  }
  if (url.pathname === '/auth/v1/logout') return reply({});
  if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
    let body = ''; for await (const chunk of req) body += chunk;
    passwordUpdates.push({ ...JSON.parse(body), id });
    return reply({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-09-15T12:00:00Z' });
  }
  if (url.pathname === '/auth/v1/user') return reply({ id, aud: 'authenticated', role: 'authenticated', email: `${id}@example.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-09-15T12:00:00Z' });
  if (url.pathname === '/rest/v1/companion_sections') return reply(id ? companionSections.filter(row => row.user_id === id) : []);
  if (url.pathname === '/rest/v1/rpc/save_companion_section') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    if (!id) { res.statusCode=403; return reply({code:'42501'}); }
    let row=companionSections.find(row=>row.user_id===id&&row.section===input.section_name);
    if ((row?.version??0)!==input.expected_version) { res.statusCode=409;return reply({code:'P0001',message:'companion_conflict'}); }
    if(!row){row={user_id:id,section:input.section_name};companionSections.push(row);}
    Object.assign(row,{payload:input.content,version:input.expected_version+1});return reply({version:row.version});
  }
  if (url.pathname.startsWith('/rest/v1/rpc/') && ['list_campus_circles','create_campus_circle','act_campus_circle','report_campus_circle'].includes(url.pathname.split('/').at(-1))) {
    let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);const operation=url.pathname.split('/').at(-1);
    if(operation==='list_campus_circles')return reply(campusCircles.filter(row=>(!input.target_circle||row.id===input.target_circle)&&(input.only_mine?row.memberIds.includes(id):row.status==='open'||input.target_circle&&row.memberIds.includes(id))).slice(0,40).map(({host_id,memberIds,...row})=>({...row,host:'qa_student',members:memberIds.length,joined:memberIds.includes(id),is_host:host_id===id,can_moderate:id===adminId,reports:id===adminId?circleReports.filter(report=>report.id===row.id&&report.status==='pending').length:0,moderation_note:id===adminId?circleReports.find(report=>report.id===row.id&&report.status==='pending')?.reason??null:null})));
    if(!id){res.statusCode=403;return reply({code:'42501'});}
    if(operation==='create_campus_circle'){const row={...input.details,id:nextId(),host_id:id,memberIds:[id],status:'open'};campusCircles.push(row);return reply({id:row.id});}
    const row=campusCircles.find(row=>row.id===input.target);if(!row){res.statusCode=404;return reply({message:'circle_notFound'});}
    if(operation==='report_campus_circle'){if(!circleReports.some(report=>report.id===row.id&&report.reporter===id&&report.status==='pending'))circleReports.push({id:row.id,reporter:id,reason:input.report_reason,status:'pending'});return reply({id:row.id});}
    if(input.operation==='close'||input.operation==='dismiss'){if(row.host_id!==id&&id!==adminId){res.statusCode=403;return reply({code:'42501'});}if(input.operation==='close')row.status='closed';for(const report of circleReports)if(report.id===row.id)report.status='resolved';}
    if(input.operation==='leave')row.memberIds=row.memberIds.filter(member=>member!==id);
    if(input.operation==='join'&&!row.memberIds.includes(id)){if(row.status!=='open'||row.memberIds.length>=row.capacity){res.statusCode=409;return reply({message:row.status!=='open'?'circle_ended':'circle_full'});}row.memberIds.push(id);}
    return reply({id:row.id});
  }
  if (url.pathname === '/rest/v1/profiles') return reply(singleton([{ id: url.searchParams.get('id')?.replace('eq.', '') || studentId, role: id === adminId ? 'admin' : 'student', full_name: 'QA Student', username: 'qa_student' }]));
  if (url.pathname === '/rest/v1/courses') {
    if (url.searchParams.get('or')?.includes('absent-course-fixture')) return reply([]);
    const row = { id: courseId, major_id: majorId, code: '10671212', slug: 'algorithms', name_ar: 'الخوارزميات', name_en: 'Algorithms' };
    if (url.searchParams.get('select')?.includes('majors!inner')) row.majors = { id: majorId, name_ar: 'علم الحاسوب', name_en: 'Computer Science', college_id: collegeId, colleges: { id: collegeId, name_ar: 'الهندسة', name_en: 'Engineering' } };
    return reply(singleton([row]));
  }
  if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'pkce') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    const challenge = input.code_verifier && createHash('sha256').update(input.code_verifier).digest('base64url');
    if (input.auth_code !== 'valid-pkce-fixture' || challenge !== recoveryRequests.at(-1)?.code_challenge) {
      res.statusCode = 400; return reply({ code: 'bad_code_verifier', msg: 'Invalid fixture verifier' });
    }
    return reply(JSON.parse(Buffer.from(cookie(studentId).split('base64-')[1], 'base64url')));
  }
  if (url.pathname === '/auth/v1/verify') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    if (input.token_hash !== 'valid-recovery-fixture' || input.type !== 'recovery') {
      res.statusCode = 403; return reply({ code: 'otp_expired', msg: 'Expired fixture token' });
    }
    return reply(JSON.parse(Buffer.from(cookie(studentId).split('base64-')[1], 'base64url')));
  }
  if (url.pathname === '/rest/v1/majors') return reply(singleton([{ id: majorId, college_id: collegeId, slug: 'computer-science', name_ar: 'علم الحاسوب', name_en: 'Computer Science' }]));
  if (url.pathname === '/rest/v1/colleges') return reply(singleton([{ id: collegeId, slug: 'engineering', name_ar: 'الهندسة', name_en: 'Engineering' }]));
  if (url.pathname === '/rest/v1/rpc/get_shared_study_set') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    const set = studySets.find(row => row.share_token === input.token && row.visibility === 'shared');
    return reply(set ? { id: set.id, title: set.title, subject: set.subject, description: set.description, visibility: set.visibility,
      cards: studyCards.filter(card => card.set_id === set.id).map(({id,front,back}) => ({id,front,back})),
      materials: studyMaterials.filter(item => item.set_id === set.id).map(({id,title,url}) => ({id,title,url})) } : null);
  }
  if (url.pathname === '/rest/v1/rpc/review_study_card') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body), card = studyCards.find(row => row.id === input.target_card), set = studySets.find(row => row.id === card?.set_id);
    if (!id || !set || !(set.owner_id === id || set.visibility === 'shared' && input.access_token === set.share_token)) { res.statusCode = 403; return reply({ code: '42501' }); }
    let review = studyReviews.find(row => row.user_id === id && row.card_id === card.id);
    if (!review) { review = { user_id: id, card_id: card.id, set_id: set.id }; studyReviews.push(review); }
    Object.assign(review, { remembered: input.knew, next_review_at: new Date(Date.now() + (input.knew ? 86400000 : 600000)).toISOString() });
    return reply({ card_id: review.card_id, remembered: review.remembered, next_review_at: review.next_review_at });
  }
  if (['/rest/v1/study_sets', '/rest/v1/study_cards', '/rest/v1/study_materials', '/rest/v1/study_card_reviews'].includes(url.pathname)) {
    const table = url.pathname.split('/').at(-1);
    const list = table === 'study_sets' ? studySets : table === 'study_cards' ? studyCards : table === 'study_materials' ? studyMaterials : studyReviews;
    const owned = row => table === 'study_sets' ? row.owner_id === id : table === 'study_card_reviews' ? row.user_id === id : studySets.some(set => set.id === row.set_id && set.owner_id === id);
    const matches = row => ['id', 'set_id', 'owner_id'].every(key => !url.searchParams.has(key) || url.searchParams.get(key) === `eq.${row[key]}`);
    if (req.method === 'POST') {
      let body = ''; for await (const chunk of req) body += chunk;
      const input = JSON.parse(body);
      if (!id || table === 'study_card_reviews' || table === 'study_sets' && input.owner_id !== id || table !== 'study_sets' && !studySets.some(set => set.id === input.set_id && set.owner_id === id)) { res.statusCode = 403; return reply({ code: '42501' }); }
      const row = { ...input, id: nextId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (table === 'study_sets') Object.assign(row, { share_token: nextId() });
      list.push(row); return reply(singleton([row]));
    }
    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const row = list.find(row => owned(row) && matches(row));
      if (!row) return reply(singleton([]));
      if (req.method === 'PATCH') {
        let body = ''; for await (const chunk of req) body += chunk;
        const input = JSON.parse(body);
        if (table === 'study_sets' && row.visibility === 'shared' && input.visibility === 'private') row.share_token = nextId();
        Object.assign(row, input, { updated_at: new Date().toISOString() });
      } else {
        list.splice(list.indexOf(row), 1);
        if (table === 'study_sets') {
          for (const child of [studyCards, studyMaterials, studyReviews]) for (let i = child.length - 1; i >= 0; i--) if (child[i].set_id === row.id) child.splice(i, 1);
        }
        if (table === 'study_cards') for (let i = studyReviews.length - 1; i >= 0; i--) if (studyReviews[i].card_id === row.id) studyReviews.splice(i, 1);
      }
      return reply(singleton([{ id: row.id }]));
    }
    let rows = id ? list.filter(row => owned(row) && matches(row)) : [];
    if (table === 'study_sets') rows = rows.map(row => ({ id:row.id,title:row.title,subject:row.subject,description:row.description,visibility:row.visibility,share_token:row.share_token,updated_at:row.updated_at, study_cards: [{count:studyCards.filter(card=>card.set_id===row.id).length}], study_materials:[{count:studyMaterials.filter(item=>item.set_id===row.id).length}] }));
    const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || rows.length);
    return reply(singleton(rows.slice(offset, offset + limit)));
  }
  if (url.pathname === '/rest/v1/rpc/signup_email_exists') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body);
    return reply(['existing@example.invalid', 'unconfirmed@example.invalid'].includes(input.candidate_email));
  }
  if (url.pathname === '/auth/v1/signup') {
    let body = ''; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body); signupRequests.push(input);
    return reply({ id: studentId, email: input.email, aud: 'authenticated', role: 'authenticated', identities: [{ id: 'new-fixture-identity', provider: 'email' }], created_at: new Date().toISOString() });
  }
  if (url.pathname === '/rest/v1/books') {
    let rows = marketBooks.filter(row => row.status === 'available');
    if (url.searchParams.has('type')) rows = rows.filter(row => `eq.${row.type}` === url.searchParams.get('type'));
    if (url.searchParams.has('college_id')) rows = rows.filter(row => `eq.${row.college_id}` === url.searchParams.get('college_id'));
    if (url.searchParams.has('title')) {
      const term = url.searchParams.get('title').replace(/^ilike\.%/, '').replace(/%$/, '').toLowerCase();
      rows = rows.filter(row => row.title.toLowerCase().includes(term));
    }
    if (url.searchParams.get('order')?.startsWith('created_at.asc')) rows.reverse();
    const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || rows.length);
    return reply(rows.slice(offset, offset + limit));
  }
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
    if (url.searchParams.get('search_vector')?.includes('resource-failure-fixture')) {
      res.statusCode = 503; return reply({ code: 'fixture_unavailable', message: 'Private database fixture error' });
    }
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
function visit(path, user = adminId, cookieOverride) {
  const start = performance.now();
  return new Promise((done, fail) => {
    const req = request(`http://localhost:4100${path}`, { headers: { ...(cookieOverride ? { cookie: cookieOverride } : user ? { cookie: cookie(user) } : {}), 'accept-encoding': 'identity', 'user-agent': 'Mozilla/5.0 PerformanceSmoke' } }, res => {
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
  // Sum the compressed JS chunks referenced by each route manifest. This is a
  // build-size regression budget, not browser transfer size or a vitals score.
  const clientJavaScript = {};
  for (const route of ['home', 'companion']) {
    const context = {};
    const path = resolve(project, `.next/server/app/[locale]/${route === 'home' ? '' : 'companion/'}page_client-reference-manifest.js`);
    runInNewContext(await readFile(path, 'utf8'), context);
    const manifest = Object.values(context.__RSC_MANIFEST)[0];
    const chunks = [...new Set(Object.values(manifest.clientModules).flatMap(entry => entry.chunks).filter(chunk => typeof chunk === 'string' && chunk.endsWith('.js')))];
    const sizes = await Promise.all(chunks.map(async chunk => {
      const body = await readFile(resolve(project, '.next', chunk.replace(/^\/_next\//, '')));
      return { bytes: body.length, gzip: gzipSync(body).length };
    }));
    clientJavaScript[route] = { chunks: chunks.length, bytes: sizes.reduce((n, item) => n + item.bytes, 0), gzipBytes: sizes.reduce((n, item) => n + item.gzip, 0) };
  }
  if (!baseline) assert.ok(clientJavaScript.companion.gzipBytes < 100_000, 'Keep the personal workspace JS below its compressed build-size budget');
  const metrics = { clientJavaScript, fixtureLatencyMs: latency, samplesPerRoute: 5, mode: baseline ? 'baseline' : 'optimized', routes: {} };
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
  // The new book campaign must preserve static home rendering: no database
  // lookup or personal account data is needed to advertise public features.
  for (const prefix of ['', '/en']) {
    const before = calls.length;
    const home = await visit(prefix || '/', null);
    assert.equal(home.status, 200);
    assert.equal(calls.length, before, 'Anonymous home must not wait for Supabase');
    assert.ok(home.body.includes('id="book-exchange-heading"'));
    assert.ok(home.body.includes(`action="${prefix}/books"`), 'Book search must target the active locale');
    assert.ok(home.body.includes(`href="${prefix}/books/new"`));
    assert.ok(home.body.includes(`href="${prefix}/offers"`), 'The teaser campaign must remain available');
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
    assert.ok(dashboard.body.includes(prefix ? 'Approve all' : 'موافقة على الكل'));
    const manage=await visit(`${prefix}/dashboard/manage?entity=resources`);
    assert.equal(manage.status,200);
    assert.ok(manage.body.includes('Editable resource &lt;script&gt;'));
    assert.ok(manage.body.includes(prefix?'Manage Rafiq content':'إدارة محتوى رفيق'));
    const unauthorizedManage=await visit(`${prefix}/dashboard/manage?entity=profiles`,studentId);
    assert.ok(unauthorizedManage.status===404||unauthorizedManage.body.includes('noindex'));
    assert.ok(!unauthorizedManage.body.includes('Editable resource'));

  }
  if (!baseline) for (const prefix of ['', '/en']) {
    const login = await visit(`${prefix}/auth/login`, null);
    assert.ok(login.body.includes(`${prefix}/auth/forgot-password`), 'Login must expose password recovery');
    const forgot = await visit(`${prefix}/auth/forgot-password`, null);
    assert.equal(forgot.status, 200); assert.ok(forgot.body.includes('name="email"'));
    const reset = await visit(`${prefix}/auth/reset-password`, null);
    assert.ok(reset.body.includes(prefix ? 'The reset link is invalid' : 'رابط الاستعادة غير صالح'));
    assert.ok(!reset.body.includes('name="confirmPassword"'), 'Anonymous sessions must not see a reset form');
    const expired = await visit(`${prefix}/auth/callback?type=recovery&token_hash=expired-fixture`, null);
    assert.equal(expired.status, 307);
    assert.ok(expired.headers.location.endsWith(`${prefix}/auth/forgot-password?result=expired`));
    const recovery = await visit(`${prefix}/auth/callback?type=recovery&token_hash=valid-recovery-fixture&next=https://evil.example`, null);
    assert.equal(recovery.status, 307);
    assert.ok(recovery.headers.location.endsWith(`${prefix}/auth/reset-password`));
    assert.ok(recovery.headers['set-cookie']?.some(value => value.includes('auth-token')), 'Verified recovery must persist the session');
    const resetForm = await visit(`${prefix}/auth/reset-password`, studentId);
    assert.ok(resetForm.body.includes('name="confirmPassword"'));
    const search = await visit(`${prefix}/resources?courseQuery=Algorithms`, null);
    assert.equal(search.status, 200);
    assert.ok(search.body.includes(`college=${collegeId}&amp;major=${majorId}&amp;course=${courseId}`), 'Search result must link directly to its valid catalog path');
    assert.ok(search.body.includes(prefix ? 'Computer Science' : 'علم الحاسوب'));
    const empty = await visit(`${prefix}/resources?courseQuery=absent-course-fixture`, null);
    assert.ok(empty.body.includes(prefix ? 'No matching courses' : 'لا توجد مساقات مطابقة'));
  }
  console.log('PASS: recovery callbacks, expired tokens, locale-aware forms and direct course search');
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
    async function action(path, name, input, user, remaining = []) {
      const entry = Object.entries(manifest.node).find(([, info]) => info.exportedName === name);
      assert.ok(entry, `Missing compiled action ${name}`);
      const encoded = await encodeReply([input, ...remaining]);
      let body = encoded, contentType = 'text/plain;charset=UTF-8';
      if (typeof encoded !== 'string') {
        const envelope = new Request('http://fixture.invalid', { method: 'POST', body: encoded });
        body = Buffer.from(await envelope.arrayBuffer());
        contentType = envelope.headers.get('content-type');
      }
      return new Promise((done, fail) => {
        const req = request(`http://localhost:4100${path}`, { method: 'POST', headers: { ...(user ? { cookie: cookie(user) } : {}), 'Next-Action': entry[0], accept: 'text/x-component', origin: 'http://localhost:4100', 'content-type': contentType } }, res => {
          let response = ''; res.on('data', b => response += b); res.on('end', () => done({ status: res.statusCode, headers: res.headers, body: response }));
        }); req.setTimeout(15000, () => req.destroy(Error('Action check timed out'))); req.on('error', fail); req.end(body);
      });
    }
    const beforeBulk=bulkApprovals;
    const deniedBulk=await action('/en/dashboard','approveAllPendingResources',null,studentId);
    assert.ok(deniedBulk.body.includes('"error":"unauthorized"'));
    assert.equal(bulkApprovals,beforeBulk);
    const bulk=await action('/en/dashboard','approveAllPendingResources',null,adminId);
    assert.ok(bulk.body.includes('"count":1107'));assert.equal(bulkApprovals,beforeBulk+1);
    const edited=await action('/en/dashboard/manage?entity=resources','mutateAdminContent',{entity:'resources',id:resourceId,version:'a'.repeat(32),operation:'update',patch:{title:'Admin renamed resource'}},adminId);
    assert.ok(edited.body.includes('"success":true'));
    const deniedAdminEdit=await action('/en/dashboard/manage?entity=resources','mutateAdminContent',{entity:'resources',id:resourceId,version:'a'.repeat(32),operation:'delete',patch:{}},studentId);
    assert.ok(deniedAdminEdit.body.includes('"error":"unauthorized"'));
    console.log('PASS: Arabic-English admin editor SSR, escaped content, bulk approval and edit/delete Server Action authorization');
    for(const prefix of ['', '/en']) {
      const guest=await visit(`${prefix}/companion`,null);assert.equal(guest.status,200);assert.ok(guest.body.includes(prefix?'Today’s tasks':'مهام اليوم'));assert.ok(guest.body.includes('noindex'));
      for (const [tab, heading] of [['semester', prefix ? 'Your semester' : 'كيف رح يتغيّر معدلك؟'], ['wallet', prefix ? 'spending' : 'سجّل مصروفك وتابع المتبقي.'], ['capsules', prefix ? 'letter' : 'اكتب لنفسك، واقرأها بعدين.']]) {
        const panel = await visit(`${prefix}/companion?tab=${tab}`, null);
        assert.equal(panel.status, 200);
        assert.ok(panel.body.includes(heading), `${tab} must render on a direct visit`);
      }
      const signed=await visit(`${prefix}/companion`,studentId);assert.equal(signed.status,200);
      const circles=await visit(`${prefix}/circles`,null);assert.equal(circles.status,200);assert.ok(circles.body.includes(prefix?'The first seat':'الكرسي الأول'));
    }
    const deniedPlan=await action('/en/companion','saveCompanion','profile',null,[{name:'Guest',intention:'steady',dailyMinutes:25},0]);assert.ok(deniedPlan.body.includes('"error":"unauthorized"'));assert.equal(companionSections.length,0);
    const planPayload={name:'Personal companion fixture',intention:'steady',dailyMinutes:25,user_id:adminId};
    const savedPlan=await action('/en/companion','saveCompanion','profile',studentId,[planPayload,0]);assert.ok(savedPlan.body.includes('"success":true'));assert.equal(companionSections[0].user_id,studentId);assert.equal('user_id' in companionSections[0].payload,false);
    const stalePlan=await action('/en/companion','saveCompanion','profile',studentId,[{...planPayload,name:'Stale device'},0]);assert.ok(stalePlan.body.includes('"error":"conflict"'));assert.equal(companionSections[0].payload.name,'Personal companion fixture');
    const ownedPlan=await visit('/en/companion',studentId);assert.ok(ownedPlan.body.includes('Personal companion fixture'));
    const otherPlan=await visit('/en/companion',adminId);assert.ok(!otherPlan.body.includes('Personal companion fixture'));
    const details={title:'HTTP campus gathering',description:'Revise and share ideas together. <script>alert(1)</script>',kind:'study',location:'Library public tables',starts_at:new Date(Date.now()+86400000).toISOString(),capacity:2,duration:25};
    const deniedCircle=await action('/en/circles','mutateCircle','create',null,[details]);assert.ok(deniedCircle.body.includes('"error":"unauthorized"'));assert.equal(campusCircles.length,0);
    const createdCircle=await action('/en/circles','mutateCircle','create',studentId,[{...details,host_id:adminId}]);assert.ok(createdCircle.body.includes('"success":true'));const circle=campusCircles[0];assert.equal(circle.host_id,studentId);
    const publicCircle=await visit(`/en/circles?circle=${circle.id}`,null);assert.ok(publicCircle.body.includes('HTTP campus gathering')&&publicCircle.body.includes('&lt;script&gt;'));
    const joinedCircle=await action('/en/circles','mutateCircle','act',adminId,[{id:circle.id,action:'join'}]);assert.ok(joinedCircle.body.includes('"success":true'));assert.equal(circle.memberIds.length,2);
    const retryJoin=await action('/en/circles','mutateCircle','act',adminId,[{id:circle.id,action:'join'}]);assert.ok(retryJoin.body.includes('"success":true'));assert.equal(circle.memberIds.length,2);
    const reportCircle=await action('/en/circles','mutateCircle','report',adminId,[{id:circle.id,reason:'Review this public gathering please'}]);assert.ok(reportCircle.body.includes('"success":true'));
    const adminCircle=await visit(`/en/circles?circle=${circle.id}`,adminId);assert.ok(adminCircle.body.includes('Review this public gathering please'));
    const hiddenReport=await visit(`/en/circles?circle=${circle.id}`,studentId);assert.ok(!hiddenReport.body.includes('Review this public gathering please'));
    const closedCircle=await action('/en/circles','mutateCircle','act',studentId,[{id:circle.id,action:'close'}]);assert.ok(closedCircle.body.includes('"success":true'));
    const closedPublic=await visit(`/en/circles?circle=${circle.id}`,null);assert.ok(!closedPublic.body.includes('HTTP campus gathering'));
    console.log('PASS: companion/circles Arabic-English SSR, private ownership, stale-version conflicts, real Server Actions, membership retries, reports and shared links');
    for (const prefix of ['', '/en']) {
      for (const email of ['existing@example.invalid', 'unconfirmed@example.invalid']) {
        const form = new FormData();
        Object.entries({ locale: prefix ? 'en' : 'ar', full_name: 'Signup Fixture', username: 'signup_fixture', email, password: 'fixture-password', confirmPassword: 'fixture-password' }).forEach(([key, value]) => form.set(key, value));
        const beforeSignup = signupRequests.length;
        const result = await action(`${prefix}/auth/register`, 'signUp', form, null);
        assert.ok((result.headers['x-action-redirect'] || result.body).includes(`${prefix}/auth/register?error=email_exists`));
        assert.equal(signupRequests.length, beforeSignup, 'Registered emails must not reach the Auth signup endpoint');
      }
      const freshForm = new FormData();
      Object.entries({ locale: prefix ? 'en' : 'ar', full_name: 'New Signup Fixture', username: 'new_signup_fixture', email: `new-${prefix ? 'en' : 'ar'}@example.invalid`, password: 'fixture-password', confirmPassword: 'fixture-password' }).forEach(([key, value]) => freshForm.set(key, value));
      const freshSignup = await action(`${prefix}/auth/register`, 'signUp', freshForm, null);
      assert.ok((freshSignup.headers['x-action-redirect'] || freshSignup.body).includes(`${prefix}/auth/login?check_email=true`), 'A genuinely new email must still complete normal signup');
      const duplicatePage = await visit(`${prefix}/auth/register?error=email_exists`, null);
      assert.ok(duplicatePage.body.includes(prefix ? 'This email is already registered' : 'هذا البريد مسجّل بالفعل'));
      assert.ok(duplicatePage.body.includes(`${prefix}/auth/forgot-password`));
      const market = await visit(`${prefix}/books`, null);
      assert.equal(market.status, 200);
      assert.ok(market.body.includes('Calculus 1') && market.body.includes('https://wa.me/970599123456'));
      assert.ok(market.body.includes(prefix ? 'Engineering' : 'الهندسة'), 'Object-shaped college relations must render');
      assert.ok(market.body.includes(`href="${prefix}/requests/new"`), 'Book requests must be reachable from the market');
      assert.ok(market.body.includes('page=2'), 'A full page must link to more results');
      assert.ok(!market.body.includes('<script>alert(1)</script>'), 'Descriptions must be escaped');
      const bookSearch = await visit(`${prefix}/books?q=Calculus&type=book&college=${collegeId}`, null);
      assert.ok(bookSearch.body.includes('Calculus 1') && !bookSearch.body.includes('University textbook 2'));
      const slides = await visit(`${prefix}/books?type=printed_slides`, null);
      assert.ok(slides.body.includes('Printed network notes') && !slides.body.includes('Calculus 1'));
      const secondPage = await visit(`${prefix}/books?page=2`, null);
      assert.ok(secondPage.body.includes('University textbook 12') && !secondPage.body.includes('Calculus 1'));
      const emptyBooks = await visit(`${prefix}/books?q=absent-book-fixture`, null);
      assert.ok(emptyBooks.body.includes(prefix ? 'No matching listings' : 'ما لقينا إعلانات مطابقة'));
    }
    console.log('PASS: duplicate confirmed/unconfirmed signup rejection and book market search/filter/pagination');
    for (const prefix of ['', '/en']) {
      const guest = await visit(`${prefix}/study`, null); assert.equal(guest.status, 200);
      assert.ok(guest.body.includes(prefix ? 'Start your first study set' : 'ابدأ حقيبتك الأولى'));
      const own = await visit(`${prefix}/study`, studentId); assert.equal(own.status, 200);
      assert.ok(own.body.includes('Networks — midterm') && !own.body.includes('Shared TCP revision'));
      const admin = await visit(`${prefix}/study`, adminId);
      assert.ok(admin.body.includes('Shared TCP revision') && !admin.body.includes('Private study notes'));
      const detail = await visit(`${prefix}/study/${ownStudyId}`, studentId); assert.equal(detail.status, 200);
      assert.ok(detail.body.includes('How do TCP and UDP differ?') && detail.body.includes('&lt;script&gt;'));
      const forbidden = await visit(`${prefix}/study/${ownStudyId}`, adminId);
      assert.ok(forbidden.status === 404 || forbidden.body.includes('noindex'));
      assert.ok(!forbidden.body.includes('Private study notes'));
      const shared = await visit(`${prefix}/study/shared/${sharedStudyToken}`, null);
      assert.equal(shared.status, 200); assert.ok(shared.body.includes('Shared TCP revision'));
      assert.ok(!shared.body.includes('id="edit-title"'), 'Shared readers must not receive an edit form');
      const sharedReview = await visit(`${prefix}/study/shared/${sharedStudyToken}/review`, null); assert.equal(sharedReview.status, 200);
      assert.ok(sharedReview.body.includes(prefix ? 'Guest progress lasts' : 'مراجعتك كضيف'));
      const badToken = await visit(`${prefix}/study/shared/afc00000-0000-4000-8000-000000009999`, null);
      assert.ok(badToken.status === 404 || badToken.body.includes('noindex'));
    }
    const deniedSet = await action('/en/study', 'mutateStudy', 'createSet', null, [{title:'Denied set'}]);
    assert.ok(deniedSet.body.includes('"error":"unauthorized"'));
    const newSet = await action('/en/study', 'mutateStudy', 'createSet', studentId, [{title:'HTTP study set',owner_id:adminId}]);
    assert.ok(newSet.body.includes('"success":true'));
    const createdSet = studySets.at(-1); assert.equal(createdSet.owner_id, studentId); assert.equal(createdSet.visibility, 'private');
    const newCard = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'addCard', studentId, [{set_id:createdSet.id,front:'HTTP flashcard question',back:'HTTP flashcard answer'}]);
    assert.ok(newCard.body.includes('"success":true')); const createdCard = studyCards.at(-1);
    const forbiddenCard = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'addCard', adminId, [{set_id:createdSet.id,front:'Hacked card',back:'Hacked answer'}]);
    assert.ok(forbiddenCard.body.includes('"error":"notFound"'));
    const editCard = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'updateCard', studentId, [{id:createdCard.id,set_id:createdSet.id,front:'Edited HTTP question',back:'Edited HTTP answer'}]);
    assert.ok(editCard.body.includes('"success":true')); assert.equal(createdCard.front,'Edited HTTP question');
    const source = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'addMaterial', studentId, [{set_id:createdSet.id,title:'HTTP lecture',url:'https://example.com/lecture'}]);
    assert.ok(source.body.includes('"success":true')); const createdMaterial = studyMaterials.at(-1);
    const settings = {id:createdSet.id,title:createdSet.title,subject:'Networks',description:'Shared by HTTP',visibility:'shared'};
    const share = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'updateSet', studentId, [settings]);
    assert.ok(share.body.includes('"success":true')); const oldToken = createdSet.share_token;
    const beforeReview = studyReviews.length;
    const guestRating = await action(`/en/study/shared/${oldToken}/review`, 'reviewStudyCard', {card_id:createdCard.id,remembered:true,token:oldToken}, null);
    assert.ok(guestRating.body.includes('"error":"unauthorized"')); assert.equal(studyReviews.length,beforeReview);
    const validRating = await action(`/en/study/shared/${oldToken}/review`, 'reviewStudyCard', {card_id:createdCard.id,remembered:false,token:oldToken,user_id:studentId}, adminId);
    assert.ok(validRating.body.includes('"success":true')); assert.equal(studyReviews.at(-1).user_id,adminId);
    const ownerReview = await visit(`/en/study/${createdSet.id}/review`, studentId);
    assert.ok(!ownerReview.body.includes('"remembered":false'), 'One reader must not receive another reader progress');
    await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'updateSet', studentId, [{...settings,visibility:'private'}]);
    const revoked = await visit(`/en/study/shared/${oldToken}`, null);
    assert.ok(revoked.status===404||revoked.body.includes('noindex')); assert.ok(!revoked.body.includes('Edited HTTP question'));
    const staleRating = await action(`/en/study/shared/${oldToken}/review`, 'reviewStudyCard', {card_id:createdCard.id,remembered:true,token:oldToken}, adminId);
    assert.ok(staleRating.body.includes('"error":"notFound"'));
    await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'updateSet', studentId, [settings]);
    assert.notEqual(createdSet.share_token,oldToken);
    const removedSource = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'deleteMaterial', studentId, [{id:createdMaterial.id,set_id:createdSet.id}]);
    assert.ok(removedSource.body.includes('"success":true'));
    const removedCard = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'deleteCard', studentId, [{id:createdCard.id,set_id:createdSet.id}]);
    assert.ok(removedCard.body.includes('"success":true')); assert.equal(studyReviews.some(row=>row.card_id===createdCard.id),false);
    const removedSet = await action(`/en/study/${createdSet.id}`, 'mutateStudy', 'deleteSet', studentId, [{id:createdSet.id}]);
    assert.ok(removedSet.body.includes('"success":true')); assert.equal(studySets.some(row=>row.id===createdSet.id),false);
    console.log('PASS: study set/card/link CRUD, private isolation, capability sharing/revocation and personal reviews');

    for (const prefix of ['', '/en']) {
      const locale = prefix ? 'en' : 'ar';
      const forgotForm = new FormData(); forgotForm.set('locale', locale); forgotForm.set('email', 'fixture@example.invalid');
      const sent = await action(`${prefix}/auth/forgot-password`, 'requestPasswordReset', forgotForm, null);
      assert.ok((sent.headers['x-action-redirect'] || sent.body).includes(`${prefix}/auth/forgot-password?result=sent`));
      assert.equal(recoveryRequests.at(-1).email, 'fixture@example.invalid');
      assert.equal(recoveryRequests.at(-1).redirectTo, `http://localhost:4100${prefix}/auth/callback?next=/auth/reset-password`);
      assert.ok(recoveryRequests.at(-1).code_challenge, 'Recovery requests must use PKCE');
      const verifierCookie = sent.headers['set-cookie']?.filter(value => value.includes('code-verifier')).map(value => value.split(';')[0]).join('; ');
      assert.ok(verifierCookie, 'Recovery must persist the PKCE verifier cookie');
      const exchanged = await visit(`${prefix}/auth/callback?code=valid-pkce-fixture&next=/auth/reset-password`, null, verifierCookie);
      assert.equal(exchanged.status, 307);
      assert.ok(exchanged.headers.location.endsWith(`${prefix}/auth/reset-password`), 'Default email flow must exchange its code and reach the password form');
      assert.ok(exchanged.headers['set-cookie']?.some(value => value.includes('auth-token')), 'PKCE exchange must persist the verified session');
      const updateForm = new FormData(); updateForm.set('locale', locale); updateForm.set('password', 'fixture-new-password'); updateForm.set('confirmPassword', 'fixture-new-password');
      const beforeUpdates = passwordUpdates.length;
      const denied = await action(`${prefix}/auth/reset-password`, 'updatePassword', updateForm, null);
      assert.ok((denied.headers['x-action-redirect'] || denied.body).includes('error=expired'));
      assert.equal(passwordUpdates.length, beforeUpdates, 'Anonymous users cannot update a password');
      const updated = await action(`${prefix}/auth/reset-password`, 'updatePassword', updateForm, studentId);
      assert.ok((updated.headers['x-action-redirect'] || updated.body).includes(`${prefix}/auth/login?password_updated=true`));
      assert.equal(passwordUpdates.at(-1).id, studentId);
      assert.equal(passwordUpdates.at(-1).password, 'fixture-new-password');
      const failedResources = await visit(`${prefix}/resources?college=${collegeId}&major=${majorId}&course=${courseId}&q=resource-failure-fixture`, null);
      assert.ok(!failedResources.body.includes(prefix ? 'No resources for this course yet' : 'لا توجد موارد لهذا المساق حتى الآن'), 'Database failures must not render the empty-course heading');
      assert.ok(!failedResources.body.includes('Private database fixture error'), 'Database error details must not leak into the page');
    }
    console.log('PASS: recovery Server Actions, verified password updates and resource query failures');
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
