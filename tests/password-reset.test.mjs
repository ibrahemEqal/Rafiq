import assert from "node:assert/strict";
import test from "node:test";
import { requestPasswordResetWithClient, updatePasswordWithClient, isPasswordRecovery } from "../lib/auth/password-reset.ts";

function fixture(overrides = {}) {
  const calls = [];
  return { calls, auth: {
    resetPasswordForEmail: async (...args) => { calls.push(["reset", ...args]); return { error: null }; },
    getUser: async () => { calls.push(["user"]); return { data: { user: { id: "verified-user" } }, error: null }; },
    updateUser: async input => { calls.push(["update", input]); return { error: null }; },
    ...overrides,
  } };
}

test("recovery trims email and uses the explicit locale-aware callback", async () => {
  const client = fixture();
  const url = "https://rafiq.example/en/auth/callback?next=/auth/reset-password";
  assert.equal(await requestPasswordResetWithClient(client, " user@example.com ", url), "sent");
  assert.deepEqual(client.calls, [["reset", "user@example.com", { redirectTo: url }]]);
});

test("invalid email and missing configuration do not send mail", async () => {
  const client = fixture();
  assert.equal(await requestPasswordResetWithClient(client, "bad", "https://rafiq.example"), "invalid");
  assert.equal(await requestPasswordResetWithClient(client, "user@example.com", null), "config");
  assert.deepEqual(client.calls, []);
});

test("recovery maps rate limits, provider errors and network failures without leaking details", async () => {
  for (const [error, expected] of [[{ status: 429 }, "rate_limited"], [{ code: "over_email_send_rate_limit" }, "rate_limited"], [{ message: "private provider detail" }, "failed"]]) {
    assert.equal(await requestPasswordResetWithClient(fixture({ resetPasswordForEmail: async () => ({ error }) }), "user@example.com", "https://rafiq.example"), expected);
  }
  assert.equal(await requestPasswordResetWithClient(fixture({ resetPasswordForEmail: async () => { throw new Error("network"); } }), "user@example.com", "https://rafiq.example"), "failed");
});

test("password mismatch and bounds are rejected before authentication calls", async () => {
  for (const input of [{ password: "short", confirmPassword: "short" }, { password: "a".repeat(73), confirmPassword: "a".repeat(73) }, { password: "secure-password", confirmPassword: "different-password" }]) {
    const client = fixture();
    assert.equal(await updatePasswordWithClient(client, input), "invalid");
    assert.deepEqual(client.calls, []);
  }
});

test("password updates require a server-verified user", async () => {
  for (const response of [{ data: { user: null }, error: null }, { data: { user: { id: "untrusted" } }, error: { message: "expired" } }]) {
    const client = fixture({ getUser: async () => response });
    assert.equal(await updatePasswordWithClient(client, { password: "secure-password", confirmPassword: "secure-password" }), "expired");
    assert.deepEqual(client.calls, []);
  }
});

test("only the password is updated after verifying the user", async () => {
  const client = fixture();
  assert.equal(await updatePasswordWithClient(client, { password: "secure-password", confirmPassword: "secure-password", role: "admin" }), "updated");
  assert.deepEqual(client.calls, [["user"], ["update", { password: "secure-password" }]]);
});

test("password provider failures never report success", async () => {
  for (const [error, expected] of [[{ code: "weak_password" }, "invalid"], [{ code: "same_password" }, "invalid"], [{ message: "internal" }, "failed"]]) {
    const client = fixture({ updateUser: async () => ({ error }) });
    assert.equal(await updatePasswordWithClient(client, { password: "secure-password", confirmPassword: "secure-password" }), expected);
  }
});

test("callback recognizes only the fixed recovery destination or recovery token type", () => {
  assert.equal(isPasswordRecovery(new URLSearchParams("next=/auth/reset-password")), true);
  assert.equal(isPasswordRecovery(new URLSearchParams("type=recovery")), true);
  for (const query of ["", "next=https://evil.example", "next=//evil.example", "next=/auth/reset-password/../../evil", "next=/dashboard"]) {
    assert.equal(isPasswordRecovery(new URLSearchParams(query)), false);
  }
});
