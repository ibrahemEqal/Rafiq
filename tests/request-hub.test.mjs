import assert from "node:assert/strict";
import test from "node:test";
import {
  requestInputSchema,
  responseInputSchema,
  parseRequestFilters,
} from "../lib/requests/validation.ts";
import {
  createRequestWithClient,
  createRequestResponseWithClient,
  updateRequestStatusWithClient,
} from "../lib/requests/mutations.ts";

const userId = "afc00000-0000-4000-8000-000000000001";
const requestId = "afc00000-0000-4000-8000-000000000002";
const courseId = "afc00000-0000-4000-8000-000000000003";

function fixture(overrides = {}) {
  const options = { authenticated: true, requestStatus: "open", ...overrides };
  const calls = [];
  const client = {
    auth: {
      async getClaims() {
        calls.push(["getClaims"]);
        return options.authenticated
          ? { data: { claims: { sub: userId, email: "student@example.invalid" } }, error: null }
          : { data: null, error: { code: "expired" } };
      },
    },
    from(table) {
      calls.push(["from", table]);
      let operation = "read";
      let payload;
      const query = {
        insert(value) { operation = "insert"; payload = value; calls.push(["insert", table, value]); return query; },
        update(value) { operation = "update"; payload = value; calls.push(["update", table, value]); return query; },
        select(columns) { calls.push(["select", table, columns]); return query; },
        eq(column, value) { calls.push(["eq", table, column, value]); return query; },
        async single() {
          if (options.dbError) return { data: null, error: { message: options.dbError } };
          return { data: { id: operation === "insert" ? requestId : payload?.id ?? requestId }, error: null };
        },
        async maybeSingle() {
          if (options.dbError) return { data: null, error: { message: options.dbError } };
          if (options.missing) return { data: null, error: null };
          if (table === "requests" && operation === "read") return { data: { id: requestId, status: options.requestStatus }, error: null };
          return { data: { id: requestId }, error: null };
        },
      };
      return query;
    },
  };
  return { client, calls };
}

const validRequest = {
  title: "Computer Networks book",
  description: "I need the latest edition in good condition.",
  type: "book",
  course_id: courseId,
};

test("request validation trims content and accepts the three supported types", () => {
  for (const type of ["book", "resource", "other"]) {
    const parsed = requestInputSchema.parse({ ...validRequest, title: "  Computer Networks book  ", type });
    assert.equal(parsed.title, "Computer Networks book");
    assert.equal(parsed.type, type);
  }
});

test("invalid request content and forged enum values are rejected", () => {
  for (const input of [
    { ...validRequest, title: "x" },
    { ...validRequest, description: "short" },
    { ...validRequest, type: "admin" },
    { ...validRequest, course_id: "not-a-guid" },
  ]) assert.equal(requestInputSchema.safeParse(input).success, false);
});

test("WhatsApp input is normalized to digits and invalid numbers are rejected", () => {
  assert.equal(responseInputSchema.parse({ request_id: requestId, body: "I can help", whatsapp_number: "+970 59-123-4567" }).whatsapp_number, "970591234567");
  assert.equal(responseInputSchema.safeParse({ request_id: requestId, body: "I can help", whatsapp_number: "123" }).success, false);
});

test("filters have safe defaults and ignore malicious values", () => {
  assert.deepEqual(parseRequestFilters({}), { q: "", type: null, status: "open", course: null, page: 1 });
  assert.deepEqual(parseRequestFilters({ type: "admin", status: "deleted", page: "1;drop table requests" }), { q: "", type: null, status: "open", course: null, page: 1 });
  assert.deepEqual(parseRequestFilters({ q: " book ", type: "book", status: "fulfilled", course: courseId, page: "2" }), { q: "book", type: "book", status: "fulfilled", course: courseId, page: 2 });
});

test("a signed-out caller cannot create requests, responses, or status changes", async () => {
  const f = fixture({ authenticated: false });
  assert.deepEqual(await createRequestWithClient(f.client, validRequest), { error: "unauthorized" });
  assert.deepEqual(await createRequestResponseWithClient(f.client, { request_id: requestId, body: "I can help" }), { error: "unauthorized" });
  assert.deepEqual(await updateRequestStatusWithClient(f.client, { request_id: requestId, status: "fulfilled" }), { error: "unauthorized" });
  assert.equal(f.calls.some(call => call[0] === "from"), false);
});

test("creating a request forces the verified requester and open status", async () => {
  const f = fixture();
  assert.deepEqual(await createRequestWithClient(f.client, { ...validRequest, requester_id: "forged", status: "fulfilled" }), { success: true, id: requestId });
  assert.ok(f.calls.some(call => call[0] === "insert" && call[1] === "requests" && call[2].requester_id === userId && call[2].status === "open"));
});

test("responses use the verified author and only target an open request", async () => {
  const f = fixture();
  assert.deepEqual(await createRequestResponseWithClient(f.client, { request_id: requestId, body: "I have it", whatsapp_number: "+970591234567" }), { success: true, id: requestId });
  assert.ok(f.calls.some(call => call[0] === "insert" && call[1] === "request_responses" && call[2].author_id === userId));

  const closed = fixture({ requestStatus: "fulfilled" });
  assert.deepEqual(await createRequestResponseWithClient(closed.client, { request_id: requestId, body: "I have it" }), { error: "closed" });
  assert.equal(closed.calls.some(call => call[0] === "insert"), false);
});

test("status changes are restricted to the verified owner in the database query", async () => {
  const f = fixture();
  assert.deepEqual(await updateRequestStatusWithClient(f.client, { request_id: requestId, status: "fulfilled" }), { success: true });
  assert.ok(f.calls.some(call => JSON.stringify(call) === JSON.stringify(["eq", "requests", "requester_id", userId])));
});

test("database errors are mapped without leaking backend details", async () => {
  const f = fixture({ dbError: "sensitive internal failure" });
  assert.deepEqual(await createRequestWithClient(f.client, validRequest), { error: "failed" });
});
