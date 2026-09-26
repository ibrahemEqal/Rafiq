import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createAnswerCommentWithClient,
  deleteAnswerCommentWithClient,
  setAnswerReactionWithClient,
} from "../lib/questions/interactions.ts";

const userId = "afc00000-0000-4000-8000-000000000001";
const otherId = "afc00000-0000-4000-8000-000000000009";
const answerId = "afc00000-0000-4000-8000-000000000002";
const commentId = "afc00000-0000-4000-8000-000000000003";

function fixture(options = {}) {
  const calls = [];
  const client = {
    auth: { async getClaims() { return options.signedOut ? { data: null, error: null } : { data: { claims: { sub: userId, email: "student@example.invalid" } }, error: null }; } },
    from(table) {
      calls.push(["from", table]);
      let operation = "read";
      const query = {
        select(columns) { calls.push(["select", table, columns]); return query; },
        eq(column, value) { calls.push(["eq", table, column, value]); return query; },
        upsert(value, config) { operation = "upsert"; calls.push(["upsert", table, value, config]); return Promise.resolve({ error: options.error ? { message: options.error } : null }); },
        insert(value) { operation = "insert"; calls.push(["insert", table, value]); return query; },
        delete() { operation = "delete"; calls.push(["delete", table]); return query; },
        async maybeSingle() {
          if (options.error) return { data: null, error: { message: options.error } };
          if (options.missing) return { data: null, error: null };
          if (table === "answers") return { data: { id: answerId, author_id: options.selfAnswer ? userId : otherId }, error: null };
          return { data: { id: commentId }, error: null };
        },
        async single() {
          if (options.error) return { data: null, error: { message: options.error } };
          assert.equal(operation, "insert");
          return { data: { id: commentId }, error: null };
        },
        then(resolve) {
          assert.equal(operation, "delete");
          return Promise.resolve({ error: options.error ? { message: options.error } : null }).then(resolve);
        },
      };
      return query;
    },
  };
  return { client, calls };
}

test("signed-out visitors cannot react, comment, or delete comments", async () => {
  for (const run of [
    client => setAnswerReactionWithClient(client, { answer_id: answerId, active: true }),
    client => createAnswerCommentWithClient(client, { answer_id: answerId, body: "Useful detail" }),
    client => deleteAnswerCommentWithClient(client, { comment_id: commentId }),
  ]) {
    const f = fixture({ signedOut: true });
    assert.deepEqual(await run(f.client), { error: "unauthorized" });
    assert.equal(f.calls.length, 0);
  }
});

test("students cannot mark their own answers helpful", async () => {
  const f = fixture({ selfAnswer: true });
  assert.deepEqual(await setAnswerReactionWithClient(f.client, { answer_id: answerId, active: true }), { error: "forbidden" });
  assert.equal(f.calls.some(call => call[0] === "upsert"), false);
});

test("helpful reactions always use the verified user and one-row conflict key", async () => {
  const f = fixture();
  assert.deepEqual(await setAnswerReactionWithClient(f.client, { answer_id: answerId, active: true, user_id: otherId }), { success: true, active: true });
  assert.deepEqual(f.calls.find(call => call[0] === "upsert"), ["upsert", "answer_reactions", { answer_id: answerId, user_id: userId }, { onConflict: "answer_id,user_id", ignoreDuplicates: true }]);
});

test("comments trim content and derive their author from verified Auth", async () => {
  const f = fixture();
  assert.deepEqual(await createAnswerCommentWithClient(f.client, { answer_id: answerId, body: "  Useful detail  ", author_id: otherId }), { success: true, id: commentId });
  assert.deepEqual(f.calls.find(call => call[0] === "insert"), ["insert", "answer_comments", { answer_id: answerId, author_id: userId, body: "Useful detail" }]);
});

test("invalid and missing interaction targets fail closed", async () => {
  assert.deepEqual(await setAnswerReactionWithClient(fixture().client, { answer_id: "bad", active: true }), { error: "invalid" });
  assert.deepEqual(await createAnswerCommentWithClient(fixture({ missing: true }).client, { answer_id: answerId, body: "Useful detail" }), { error: "notFound" });
});

test("interaction migration has RLS, self-vote denial, cascades and durable comment limits", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260926010000_answer_interactions.sql", import.meta.url), "utf8");
  for (const required of ["answer_reactions", "answer_comments", "enable row level security", "not exists", "on delete cascade", "answer_comment", "trg_answer_comments_rate_limit", "pg_advisory_xact_lock"]) assert.match(sql, new RegExp(required));
  assert.doesNotMatch(sql, /service_role_key|SUPABASE_SERVICE/);
});
