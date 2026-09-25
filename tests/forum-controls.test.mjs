import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { updateQuestionSchema, updateAnswerSchema, reportSchema, forumTargetSchema } from '../lib/questions/validation.ts';
import { updateQuestionWithClient, updateAnswerWithClient, deleteForumPostWithClient, createReportWithClient } from '../lib/questions/mutations.ts';

const userId = 'afc00000-0000-4000-8000-000000000001';
const otherId = 'afc00000-0000-4000-8000-000000000009';
const questionId = 'afc00000-0000-4000-8000-000000000002';
const answerId = 'afc00000-0000-4000-8000-000000000003';
const courseId = '11111111-1111-1111-1111-111111111111';

function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: { async getClaims() { return { data: options.signedOut ? null : { claims: { sub: userId, email: 'student@example.invalid' } }, error: options.authError ? { message: 'expired' } : null }; } },
    from(table) {
      calls.push(['from', table]);
      let operation = 'read';
      const query = {
        select(columns) { calls.push(['select', table, columns]); return query; },
        eq(column, value) { calls.push(['eq', table, column, value]); return query; },
        update(value) { operation = 'update'; calls.push(['update', table, value]); return query; },
        delete() { operation = 'delete'; calls.push(['delete', table]); return query; },
        insert(value) { operation = 'insert'; calls.push(['insert', table, value]); return query; },
        async maybeSingle() {
          if (options.throwRead) throw Error('private detail');
          if (options.errorMessage) return { data: null, error: { message: options.errorMessage } };
          if (options.noMatch) return { data: null, error: null };
          if (operation === 'update' && table === 'answers') return { data: { id: answerId, question_id: questionId }, error: null };
          if (operation === 'update') return { data: { id: questionId }, error: null };
          if (operation === 'delete' && table === 'answers') return { data: { id: answerId, question_id: questionId }, error: null };
          if (operation === 'delete') return { data: { id: questionId }, error: null };
          if (table === 'courses') return { data: options.missingCourse ? null : { id: courseId }, error: null };
          return { data: options.missingTarget ? null : { id: questionId, author_id: options.selfTarget ? userId : otherId }, error: null };
        },
        async single() {
          assert.equal(operation, 'insert');
          if (options.errorMessage) return { data: null, error: { message: options.errorMessage } };
          return { data: options.noReturnedRow ? null : { id: 'afc00000-0000-4000-8000-000000000004' }, error: null };
        },
      };
      return query;
    },
  };
  return { client, calls };
}

test('edit, delete and report inputs reject malformed IDs and text', () => {
  assert.equal(updateQuestionSchema.safeParse({ question_id: questionId, title: 'Valid title', body: 'A useful body here', course_id: null }).success, true);
  assert.equal(updateAnswerSchema.safeParse({ answer_id: answerId, body: 'Fixed answer' }).success, true);
  assert.equal(reportSchema.safeParse({ target_type: 'answer', target_id: answerId, reason: 'This answer is abusive' }).success, true);
  for (const value of [null, { target_type: 'profile', target_id: answerId }, { target_type: 'answer', target_id: 'bad' }]) assert.equal(forumTargetSchema.safeParse(value).success, false);
  assert.equal(reportSchema.safeParse({ target_type: 'answer', target_id: answerId, reason: 'short' }).success, false);
});

test('every forum mutation re-verifies Auth before touching tables', async () => {
  for (const options of [{ signedOut: true }, { authError: true }]) {
    for (const run of [
      client => updateQuestionWithClient(client, { question_id: questionId, title: 'Valid title', body: 'A useful body here', course_id: null }),
      client => updateAnswerWithClient(client, { answer_id: answerId, body: 'Fixed answer' }),
      client => deleteForumPostWithClient(client, { target_type: 'answer', target_id: answerId }),
      client => createReportWithClient(client, { target_type: 'answer', target_id: answerId, reason: 'This answer is abusive' }),
    ]) {
      const f = fixture(options);
      assert.deepEqual(await run(f.client), { error: 'unauthorized' });
      assert.equal(f.calls.length, 0);
    }
  }
});

test('question edits whitelist mutable fields and validate the course', async () => {
  const f = fixture();
  assert.deepEqual(await updateQuestionWithClient(f.client, { question_id: questionId, title: '  Better title  ', body: '  Better explanation here  ', course_id: courseId, author_id: otherId, role: 'admin', created_at: 'spoofed' }), { success: true, id: questionId });
  assert.deepEqual(f.calls.find(call => call[0] === 'update'), ['update', 'questions', { title: 'Better title', body: 'Better explanation here', course_id: courseId }]);
  assert.equal(f.calls.some(call => call[0] === 'eq' && call[1] === 'questions' && call[2] === 'id' && call[3] === questionId), true);
});

test('answer edits and deletes return the trusted parent question', async () => {
  const edit = fixture();
  assert.deepEqual(await updateAnswerWithClient(edit.client, { answer_id: answerId, body: '  Corrected answer  ', author_id: otherId }), { success: true, id: answerId, questionId });
  assert.deepEqual(edit.calls.find(call => call[0] === 'update'), ['update', 'answers', { body: 'Corrected answer' }]);
  const remove = fixture();
  assert.deepEqual(await deleteForumPostWithClient(remove.client, { target_type: 'answer', target_id: answerId, question_id: 'spoofed' }), { success: true, id: answerId, questionId });
});

test('RLS-hidden or missing mutation targets are reported as not found', async () => {
  for (const run of [
    client => updateAnswerWithClient(client, { answer_id: answerId, body: 'Corrected answer' }),
    client => deleteForumPostWithClient(client, { target_type: 'question', target_id: questionId }),
  ]) assert.deepEqual(await run(fixture({ noMatch: true }).client), { error: 'notFound' });
});

test('reports reject self-reporting and derive the reporter from Auth', async () => {
  const self = fixture({ selfTarget: true });
  assert.deepEqual(await createReportWithClient(self.client, { target_type: 'question', target_id: questionId, reason: 'I am reporting my own post' }), { error: 'forbidden' });
  assert.equal(self.calls.some(call => call[0] === 'insert'), false);
  const other = fixture();
  assert.ok('success' in await createReportWithClient(other.client, { target_type: 'answer', target_id: answerId, reason: '  This answer contains harassment  ', reporter_id: otherId, status: 'reviewed' }));
  assert.deepEqual(other.calls.find(call => call[0] === 'insert'), ['insert', 'reports', { reporter_id: userId, target_type: 'answer', target_id: answerId, reason: 'This answer contains harassment' }]);
});

test('database guard failures map to stable UI errors without leaking details', async () => {
  assert.deepEqual(await createReportWithClient(fixture({ errorMessage: 'duplicate_pending_report secret SQL' }).client, { target_type: 'answer', target_id: answerId, reason: 'This answer contains harassment' }), { error: 'failed' });
  const duplicate = fixture();
  let reportRead = 0;
  const originalFrom = duplicate.client.from;
  duplicate.client.from = table => {
    const query = originalFrom(table);
    if (table === 'reports') query.single = async () => ({ data: null, error: { message: 'duplicate_pending_report private' } });
    reportRead += 1;
    return query;
  };
  assert.deepEqual(await createReportWithClient(duplicate.client, { target_type: 'answer', target_id: answerId, reason: 'This answer contains harassment' }), { error: 'duplicate' });
  assert.ok(reportRead >= 2);
  const limited = fixture({ errorMessage: 'forum_rate_limited private' });
  assert.deepEqual(await updateAnswerWithClient(limited.client, { answer_id: answerId, body: 'Corrected answer' }), { error: 'rateLimited' });
});

test('migration contains durable database limits, duplicate serialization and orphan cleanup', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260916200000_forum_moderation_controls.sql', import.meta.url), 'utf8');
  for (const required of ['forum_rate_events', 'revoke all on table public.forum_rate_events', 'trg_questions_rate_limit', 'trg_answers_rate_limit', 'pg_advisory_xact_lock', 'duplicate_pending_report', 'self_report_forbidden', 'trg_questions_cleanup_reports', 'trg_answers_cleanup_reports', 'reports_reason_length']) assert.match(sql, new RegExp(required));
  assert.doesNotMatch(sql, /service_role_key|SUPABASE_SERVICE/);
});
