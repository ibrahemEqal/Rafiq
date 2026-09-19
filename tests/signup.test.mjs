import assert from "node:assert/strict";
import test from "node:test";
import { localizedPath, parseLocale, resolveSiteOrigin, signUpWithClient } from "../lib/auth/signup.ts";

const validInput = {
  locale: "ar",
  full_name: "  Ibrahim Eqal  ",
  username: "  ibrahem_1  ",
  email: "  student@example.com  ",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

function fixture(result = { data: { user: { identities: [{ id: "identity" }] }, session: null }, error: null }) {
  const calls = [];
  const client = {
    auth: {
      async signUp(input) {
        calls.push(input);
        if (result instanceof Error) throw result;
        return result;
      },
    },
  };
  return { client, calls };
}

test("locale and paths use Arabic as the safe default", () => {
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("fr"), "ar");
  assert.equal(localizedPath("ar", "/auth/login"), "/auth/login");
  assert.equal(localizedPath("en", "/auth/login"), "/en/auth/login");
});

test("site origin prefers configured production URL and safely falls back to request origin", () => {
  assert.equal(resolveSiteOrigin("https://rafeeq.example/path", "http://localhost:3000"), "https://rafeeq.example");
  assert.equal(resolveSiteOrigin(undefined, "http://localhost:3000"), "http://localhost:3000");
  assert.equal(resolveSiteOrigin("rafeeq.example", null), "https://rafeeq.example");
  assert.equal(resolveSiteOrigin("javascript:alert(1)", null), null);
  assert.equal(resolveSiteOrigin("https://user:pass@rafeeq.example", null), null);
});

test("invalid input and mismatched passwords never call Supabase", async () => {
  for (const [input, code] of [
    [{ ...validInput, password: "different" }, "mismatch"],
    [{ ...validInput, password: "short", confirmPassword: "short" }, "invalid"],
    [{ ...validInput, username: "bad name" }, "invalid"],
  ]) {
    const f = fixture();
    assert.deepEqual(await signUpWithClient(f.client, input, "https://rafeeq.example"), { code });
    assert.equal(f.calls.length, 0);
  }
});

test("missing site origin fails before contacting Supabase", async () => {
  const f = fixture();
  assert.deepEqual(await signUpWithClient(f.client, validInput, null), { code: "config" });
  assert.equal(f.calls.length, 0);
});

test("email-confirmation signup trims fields and uses the locale-aware callback", async () => {
  const f = fixture();
  assert.deepEqual(await signUpWithClient(f.client, validInput, "https://rafeeq.example"), { code: "check_email" });
  assert.deepEqual(f.calls, [{
    email: "student@example.com",
    password: "correct-horse",
    options: {
      data: { full_name: "Ibrahim Eqal", username: "ibrahem_1", preferred_language: "ar" },
      emailRedirectTo: "https://rafeeq.example/auth/callback",
    },
  }]);

  const en = fixture();
  await signUpWithClient(en.client, { ...validInput, locale: "en" }, "https://rafeeq.example");
  assert.equal(en.calls[0].options.emailRedirectTo, "https://rafeeq.example/en/auth/callback");
});

test("a returned session reports an immediately usable account", async () => {
  const f = fixture({ data: { user: { identities: [{ id: "identity" }] }, session: { access_token: "token" } }, error: null });
  assert.deepEqual(await signUpWithClient(f.client, validInput, "https://rafeeq.example"), { code: "account_ready" });
});

test("an obfuscated existing account is not reported as a sent email", async () => {
  const f = fixture({ data: { user: { identities: [] }, session: null }, error: null });
  assert.deepEqual(await signUpWithClient(f.client, validInput, "https://rafeeq.example"), { code: "email_exists" });
});

for (const [error, code] of [
  [{ code: "user_already_exists", status: 422 }, "email_exists"],
  [{ code: "over_email_send_rate_limit", status: 429 }, "rate_limited"],
  [{ code: "weak_password", status: 422 }, "invalid"],
  [{ code: "private_database_failure", status: 500, message: "secret" }, "failed"],
]) {
  test(`Supabase ${error.code} maps to stable ${code} feedback`, async () => {
    const f = fixture({ data: { user: null, session: null }, error });
    assert.deepEqual(await signUpWithClient(f.client, validInput, "https://rafeeq.example"), { code });
  });
}

test("unexpected network failures return generic feedback", async () => {
  const f = fixture(new Error("private network details"));
  assert.deepEqual(await signUpWithClient(f.client, validInput, "https://rafeeq.example"), { code: "failed" });
});
