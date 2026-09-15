import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminAccess,
  moderateResourceWithClient,
  createAdminPreviewWithClient,
  parseReviewFilters,
} from "../lib/admin/resource-review.ts";

const userId = "afc00000-0000-4000-8000-000000000001";
const resourceId = "afc00000-0000-4000-8000-000000000002";
const decision = { resourceId, expectedStatus: "pending", status: "approved" };

function fixture(overrides = {}) {
  const options = { role: "admin", authenticated: true, ...overrides };
  const calls = [];
  const client = {
    auth: {
      async getUser() {
        calls.push(["getUser"]);
        return {
          data: { user: options.authenticated ? { id: userId, user_metadata: { role: "admin" } } : null },
          error: options.authError ? { code: "expired" } : null,
        };
      },
    },
    from(table) {
      calls.push(["from", table]);
      let update;
      const query = {
        select(columns) { calls.push(["select", table, columns]); return query; },
        eq(column, value) { calls.push(["eq", table, column, value]); return query; },
        update(value) { update = value; calls.push(["update", table, value]); return query; },
        async maybeSingle() {
          if (table === "profiles") return {
            data: options.role ? { role: options.role } : null,
            error: options.profileError ? { code: "offline" } : null,
          };
          return {
            data: options.missing ? null : update
              ? { id: resourceId, status: options.returnedStatus ?? update.status }
              : { storage_path: `${userId}/stored.pdf` },
            error: options.resourceError ? { code: "offline" } : null,
          };
        },
      };
      return query;
    },
    storage: {
      from(bucket) {
        return {
          async createSignedUrl(path, expires, config) {
            calls.push(["sign", bucket, path, expires, config]);
            return {
              data: options.signingError ? null : { signedUrl: "https://example.invalid/signed" },
              error: options.signingError ? { code: "offline" } : null,
            };
          },
        };
      },
    },
    async rpc(name) { calls.push(["rpc", name]); return { error: null }; },
  };
  return { client, calls, options };
}

test("authorization reads the role using the verified Auth user ID", async () => {
  const f = fixture();
  assert.deepEqual(await getAdminAccess(f.client), { userId, isAdmin: true });
  assert.ok(f.calls.some((call) => JSON.stringify(call) === JSON.stringify(["eq", "profiles", "id", userId])));
});

for (const [name, options] of [
  ["signed out", { authenticated: false }],
  ["expired session", { authError: true }],
  ["student with spoofed admin metadata", { role: "student" }],
  ["missing profile", { role: null }],
  ["role lookup failure", { profileError: true }],
]) {
  test(`${name} cannot review or obtain a signed review link`, async () => {
    const f = fixture(options);
    assert.deepEqual(await moderateResourceWithClient(f.client, { ...decision, role: "admin" }), { error: "unauthorized" });
    assert.deepEqual(await createAdminPreviewWithClient(f.client, resourceId), { error: "unauthorized" });
    assert.equal(f.calls.some((call) => call[0] === "from" && call[1] === "resources"), false);
    assert.equal(f.calls.some((call) => call[0] === "sign"), false);
  });
}

for (const [expectedStatus, status] of [
  ["pending", "approved"], ["pending", "rejected"], ["approved", "removed"],
  ["rejected", "pending"], ["removed", "pending"],
]) {
  test(`admin can transition ${expectedStatus} to ${status} with an atomic status filter`, async () => {
    const f = fixture();
    assert.deepEqual(await moderateResourceWithClient(f.client, { resourceId, expectedStatus, status }), { success: true });
    assert.ok(f.calls.some((call) => JSON.stringify(call) === JSON.stringify(["eq", "resources", "status", expectedStatus])));
    assert.ok(f.calls.some((call) => JSON.stringify(call) === JSON.stringify(["update", "resources", { status }])));
  });
}

test("invalid IDs/statuses/transitions never update resources", async () => {
  for (const input of [
    null, { ...decision, resourceId: "bad-id" }, { ...decision, status: "admin" },
    { ...decision, expectedStatus: "rejected", status: "approved" },
    { ...decision, status: "pending" },
  ]) {
    const f = fixture();
    assert.deepEqual(await moderateResourceWithClient(f.client, input), { error: "invalid" });
    assert.equal(f.calls.some((call) => call[0] === "update"), false);
  }
});

test("no matching old-status row is reported as a conflict", async () => {
  const f = fixture({ missing: true });
  assert.deepEqual(await moderateResourceWithClient(f.client, decision), { error: "conflict" });
});

test("trigger reversion is not reported as a successful approval", async () => {
  const f = fixture({ returnedStatus: "pending" });
  assert.deepEqual(await moderateResourceWithClient(f.client, decision), { error: "failed" });
});

test("database errors do not leak their details", async () => {
  const f = fixture({ resourceError: true });
  assert.deepEqual(await moderateResourceWithClient(f.client, decision), { error: "failed" });
});

test("admin role is rechecked for every action after a downgrade", async () => {
  const f = fixture();
  assert.deepEqual(await moderateResourceWithClient(f.client, decision), { success: true });
  f.options.role = "student";
  assert.deepEqual(await moderateResourceWithClient(f.client, decision), { error: "unauthorized" });
  assert.equal(f.calls.filter((call) => call[0] === "update").length, 1);
});

test("review links use the DB path, force attachment, expire in 60 seconds and do not count downloads", async () => {
  const f = fixture();
  assert.deepEqual(await createAdminPreviewWithClient(f.client, resourceId), { url: "https://example.invalid/signed" });
  assert.ok(f.calls.some((call) => JSON.stringify(call) === JSON.stringify(["sign", "resources", `${userId}/stored.pdf`, 60, { download: true }])));
  assert.equal(f.calls.some((call) => call[0] === "rpc"), false);
});

test("review signing failures return an error rather than a raw path", async () => {
  const f = fixture({ signingError: true });
  assert.deepEqual(await createAdminPreviewWithClient(f.client, resourceId), { error: "previewFailed" });
});

test("untrusted filtering and page inputs have safe defaults", () => {
  assert.deepEqual(parseReviewFilters({}), { status: "pending", page: 1 });
  assert.deepEqual(parseReviewFilters({ status: ["approved"], page: "1;drop table resources" }), { status: "pending", page: 1 });
  assert.deepEqual(parseReviewFilters({ status: "approved", page: "2" }), { status: "approved", page: 2 });
  assert.deepEqual(parseReviewFilters({ status: "bad", page: "-10" }), { status: "pending", page: 1 });
  assert.deepEqual(parseReviewFilters({ page: "0" }), { status: "pending", page: 1 });
});
