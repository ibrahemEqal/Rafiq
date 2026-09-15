import test from 'node:test';
import assert from 'node:assert/strict';
import { pickClientMessages } from '../lib/i18n/client-messages.ts';
import { oneRelation } from '../lib/data/relations.ts';

for (const namespace of ['Resources', 'Books', 'Admin']) {
  test(`only ${namespace} messages are passed to its interactive section`, () => {
    const messages = { Resources: { download: 'Download' }, Books: { title: 'Books' }, Admin: { approve: 'Approve' }, Auth: { password: 'Password' } };
    const selected = pickClientMessages(messages, namespace);
    assert.deepEqual(Object.keys(selected), [namespace]);
    assert.equal(selected[namespace], messages[namespace]);
    assert.equal('Auth' in selected, false);
    assert.equal(Object.keys(messages).length, 4);
  });
}
test('missing message namespace fails explicitly', () => assert.throws(() => pickClientMessages({}, 'Admin'), /Missing/));
test('PostgREST object, array and absent to-one relations normalize consistently', () => {
  const value = { full_name: 'Student', name_en: 'Algorithms' };
  assert.equal(oneRelation(value), value);
  assert.equal(oneRelation([value]), value);
  assert.equal(oneRelation([]), undefined);
  assert.equal(oneRelation(null), undefined);
  assert.equal(oneRelation(undefined), undefined);
});
