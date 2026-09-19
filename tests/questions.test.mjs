import test from 'node:test';
import assert from 'node:assert/strict';
import { questionSchema, answerSchema, parseQuestionFilters } from '../lib/questions/validation.ts';
import { createQuestionWithClient, createAnswerWithClient } from '../lib/questions/mutations.ts';

const userId = 'afc00000-0000-4000-8000-000000000001';
const questionId = 'afc00000-0000-4000-8000-000000000002';
const courseId = '11111111-1111-1111-1111-111111111111';
const question = { title: 'How does BFS work?', body: 'I tried a queue but need help tracing the graph.', course_id: courseId };
const answer = { question_id: questionId, body: 'Use a FIFO queue and visit each node once.' };
function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: { async getClaims() { return { data: options.signedOut ? null : { claims: { sub: userId, email: 'student@example.invalid' } }, error: options.authError ? { message: 'expired' } : null }; } },
    from(table) {
      calls.push(['from', table]);
      let inserted;
      const query = {
        select(columns) { calls.push(['select', table, columns]); return query; },
        eq(column, value) { calls.push(['eq', table, column, value]); return query; },
        insert(payload) { inserted = payload; calls.push(['insert', table, payload]); return query; },
        async maybeSingle() {
          if (options.throwRead) throw Error('private database details');
          return { data: options.missing || (table === 'courses' && options.missingCourse) ? null : { id: table === 'courses' ? courseId : questionId }, error: options.readError ? { message: 'private database details' } : null };
        },
        async single() {
          assert.ok(inserted);
          if (options.throwInsert) throw Error('private database details');
          return { data: options.noReturnedRow ? null : { id: questionId }, error: options.insertError ? { message: 'private database details' } : null };
        },
      }; return query;
    },
  }; return { client, calls };
}

test('question text is trimmed, optional course defaults to null, seeded PG IDs are accepted', () => {
  assert.deepEqual(questionSchema.parse({ title: '  Hello world  ', body: '  A useful question body  ' }), { title: 'Hello world', body: 'A useful question body', course_id: null });
  assert.equal(questionSchema.safeParse(question).success, true);
});
test('question title/body limits and unsupported course values are rejected', () => {
  for (const input of [null, { ...question, title: '    ' }, { ...question, title: 'tiny' }, { ...question, title: 'x'.repeat(161) }, { ...question, body: 'short' }, { ...question, body: ' '.repeat(20) }, { ...question, body: 'x'.repeat(8001) }, { ...question, course_id: '' }, { ...question, course_id: 'not-a-guid' }]) assert.equal(questionSchema.safeParse(input).success, false);
  assert.equal(questionSchema.safeParse({ ...question, title: 'x'.repeat(160), body: 'x'.repeat(8000) }).success, true);
});
test('answer limits and IDs are validated', () => {
  for (const input of [null, { ...answer, question_id: 'bad' }, { ...answer, body: ' ' }, { ...answer, body: 'x' }, { ...answer, body: 'x'.repeat(8001) }]) assert.equal(answerSchema.safeParse(input).success, false);
  assert.equal(answerSchema.safeParse({ ...answer, body: 'x'.repeat(8000) }).success, true);
});
for (const options of [{ signedOut: true }, { authError: true }]) {
  test(`missing/invalid Auth denies question and answer creation: ${JSON.stringify(options)}`, async () => {
    const f = fixture(options);
    assert.deepEqual(await createQuestionWithClient(f.client, question), { error: 'unauthorized' });
    assert.deepEqual(await createAnswerWithClient(f.client, answer), { error: 'unauthorized' });
    assert.equal(f.calls.length, 0);
  });
}
test('new question ignores spoofed author, ID, timestamp and role', async () => {
  const f = fixture();
  assert.deepEqual(await createQuestionWithClient(f.client, { ...question, title: '  How does BFS work?  ', author_id: 'victim', id: 'spoofed', created_at: 'spoofed', role: 'admin' }), { success: true, id: questionId });
  assert.deepEqual(f.calls.find(c => c[0] === 'insert'), ['insert', 'questions', { ...question, author_id: userId }]);
  assert.ok(f.calls.some(c => c[0] === 'eq' && c[1] === 'courses' && c[3] === courseId));
});
test('general questions do not read the course table', async () => {
  const f = fixture();
  assert.ok('success' in await createQuestionWithClient(f.client, { ...question, course_id: null }));
  assert.equal(f.calls.some(c => c[1] === 'courses'), false);
});
test('nonexistent course cannot be used for a new question', async () => {
  const f = fixture({ missingCourse: true });
  assert.deepEqual(await createQuestionWithClient(f.client, question), { error: 'invalid' });
  assert.equal(f.calls.some(c => c[0] === 'insert'), false);
});
test('new answer checks the existing question and uses the verified author', async () => {
  const f = fixture();
  assert.ok('success' in await createAnswerWithClient(f.client, { ...answer, author_id: 'victim', questionId: 'spoofed' }));
  assert.deepEqual(f.calls.find(c => c[0] === 'insert'), ['insert', 'answers', { ...answer, author_id: userId }]);
  assert.ok(f.calls.some(c => c[0] === 'eq' && c[1] === 'questions' && c[3] === questionId));
});
test('deleted/nonexistent questions cannot receive an answer', async () => {
  const f = fixture({ missing: true });
  assert.deepEqual(await createAnswerWithClient(f.client, answer), { error: 'notFound' });
  assert.equal(f.calls.some(c => c[0] === 'insert'), false);
});
test('invalid inputs never insert records', async () => {
  const f = fixture();
  assert.deepEqual(await createQuestionWithClient(f.client, { ...question, body: '' }), { error: 'invalid' });
  assert.deepEqual(await createAnswerWithClient(f.client, { ...answer, question_id: 'bad' }), { error: 'invalid' });
  assert.equal(f.calls.some(c => c[0] === 'insert'), false);
});
test('read/write/network failures are generic and never leak database details', async () => {
  for (const options of [{ readError: true }, { throwRead: true }, { insertError: true }, { throwInsert: true }, { noReturnedRow: true }]) {
    const f = fixture(options);
    assert.deepEqual(await createQuestionWithClient(f.client, question), { error: 'failed' });
    assert.deepEqual(await createAnswerWithClient(f.client, answer), { error: 'failed' });
  }
});
test('Auth is rechecked on each write, including after sign-out', async () => {
  const options = {};
  const f = fixture(options);
  assert.ok('success' in await createQuestionWithClient(f.client, question));
  options.signedOut = true;
  assert.deepEqual(await createAnswerWithClient(f.client, answer), { error: 'unauthorized' });
  assert.equal(f.calls.filter(c => c[0] === 'insert').length, 1);
});
test('untrusted query filters and page inputs are normalized safely', () => {
  assert.deepEqual(parseQuestionFilters({ q: '  BFS  ', course: courseId, page: '2' }), { q: 'BFS', course: courseId, page: 2 });
  assert.equal(parseQuestionFilters({ q: 'x'.repeat(200) }).q.length, 80);
  for (const page of ['0', '-2', '1.5', '999999999999', ['2'], 'script']) assert.equal(parseQuestionFilters({ page }).page, 1);
  assert.deepEqual(parseQuestionFilters({ q: ['spoofed'], course: 'bad' }), { q: '', course: undefined, page: 1 });
});
