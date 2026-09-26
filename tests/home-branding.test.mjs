import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const [hero, features, navbar, arabic, english, logo] = await Promise.all([
  readFile(new URL("../components/home/Hero.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/home/Features.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/layout/Navbar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../messages/ar.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../messages/en.json", import.meta.url), "utf8").then(JSON.parse),
  stat(new URL("../public/brand/rafeeq-logo.webp", import.meta.url)),
]);

test("the real Rafeeq logo is rendered with Next Image above the fold", () => {
  assert.match(hero, /from "next\/image"/);
  assert.match(hero, /src="\/brand\/rafeeq-logo\.webp"/);
  assert.match(hero, /preload/);
  assert.match(navbar, /src="\/brand\/rafeeq-logo\.webp"/);
  assert.ok(logo.size > 0 && logo.size < 100_000);
});

test("the branded home page remains server-rendered and links to every core space", () => {
  assert.doesNotMatch(hero, /["']use client["']/);
  assert.doesNotMatch(features, /["']use client["']/);
  for (const href of ["/resources", "/books", "/questions", "/requests"]) {
    assert.match(`${hero}\n${features}`, new RegExp(`href(?:\\s*=|:)\\s*["']${href}["']`));
  }
});

test("Arabic and English home-page translations have identical keys", () => {
  assert.deepEqual(Object.keys(arabic.HomePage).sort(), Object.keys(english.HomePage).sort());
});
