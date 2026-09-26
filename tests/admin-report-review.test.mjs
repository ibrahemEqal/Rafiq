import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReportFilters, moderateReportWithClient } from '../lib/admin/report-review.ts';

const userId = 'afc00000-0000-4000-8000-000000000001';
const reportId = 'afc00000-0000-4000-8000-000000000005';

function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: { async getClaims() { return { data: options.signedOut ? null : { claims: { sub: userId, email: 'admin@example.invalid' } }, error: null }; } },
    from(table) {
      calls.push(['from', table]);
      let payload; let status;
      const query = {
        select(columns) { calls.push(['select', table, columns]); return query; },
        update(value) { payload = value; calls.push(['update', table, value]); return query; },
        eq(column, value) { calls.push(['eq', table, column, value]); if (column === 'status' && !payload) status = value; return query; },
        async maybeSingle() {
          if (table === 'profiles') return { data: options.admin === false ? { role: 'student' } : { role: 'admin' }, error: null };
          if (options.error) return { data: null, error: { message: 'private database error' } };
          if (options.conflict) return { data: null, error: null };
          return { data: { id: reportId, status: options.reverted ? status : payload.status }, error: null };
        },
      };
      return query;
    },
  };
  return { client, calls };
}

test('report review filters have bounded safe defaults', () => {
  assert.deepEqual(parseReportFilters({ status: 'reviewed', page: '3' }), { status: 'reviewed', page: 3 });
  for (const page of ['0', '-1', '1.2', '9999999', ['2']]) assert.equal(parseReportFilters({ page }).page, 1);
  assert.equal(parseReportFilters({ status: 'admin' }).status, 'pending');
});

test('signed-out and student accounts cannot moderate reports', async () => {
  for (const options of [{ signedOut: true }, { admin: false }]) {
    const f = fixture(options);
    assert.deepEqual(await moderateReportWithClient(f.client, { reportId, expectedStatus: 'pending', status: 'reviewed' }), { error: 'unauthorized' });
    assert.equal(f.calls.some(call => call[0] === 'update'), false);
  }
});

test('admin report transitions use an atomic expected-status filter', async () => {
  const f = fixture();
  assert.deepEqual(await moderateReportWithClient(f.client, { reportId, expectedStatus: 'pending', status: 'reviewed' }), { success: true });
  assert.deepEqual(f.calls.find(call => call[0] === 'update'), ['update', 'reports', { status: 'reviewed' }]);
  assert.equal(f.calls.some(call => call[0] === 'eq' && call[2] === 'status' && call[3] === 'pending'), true);
});

test('invalid transitions, conflicts, database errors and trigger reversions fail closed', async () => {
  assert.deepEqual(await moderateReportWithClient(fixture().client, { reportId, expectedStatus: 'pending', status: 'pending' }), { error: 'invalid' });
  assert.deepEqual(await moderateReportWithClient(fixture({ conflict: true }).client, { reportId, expectedStatus: 'pending', status: 'reviewed' }), { error: 'conflict' });
  assert.deepEqual(await moderateReportWithClient(fixture({ error: true }).client, { reportId, expectedStatus: 'pending', status: 'reviewed' }), { error: 'failed' });
  assert.deepEqual(await moderateReportWithClient(fixture({ reverted: true }).client, { reportId, expectedStatus: 'pending', status: 'reviewed' }), { error: 'failed' });
});
