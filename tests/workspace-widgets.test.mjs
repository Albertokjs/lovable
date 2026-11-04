import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

test("dedicated widgets persist per workspace and scroll reveals respect motion preferences", async () => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "msedge" } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://localhost:5173/");
    const switchTo = name => page.locator(".profile").filter({ hasText: name }).click();
    await switchTo("Study");
    await page.getByLabel("New study mission", { exact: true }).fill("Revise orbital mechanics");
    await page.getByRole("button", { name: "Add mission", exact: true }).click();
    await page.getByLabel("Revise orbital mechanics", { exact: true }).check();
    await page.getByLabel("Flashcard question", { exact: true }).fill("What holds planets in orbit?");
    await page.getByLabel("Flashcard answer", { exact: true }).fill("Gravity");
    await page.getByRole("button", { name: "Add flashcard", exact: true }).click();
    await page.getByRole("button", { name: "Reveal answer", exact: true }).click();
    assert.match(await page.locator(".recall-card").innerText(), /Gravity/);
    await switchTo("Gaming");
    assert.equal(await page.getByLabel("New study mission", { exact: true }).count(), 0);
    await page.getByLabel("Game title", { exact: true }).fill("No Man's Sky");
    await page.getByRole("button", { name: "Add game", exact: true }).click();
    await page.getByRole("button", { name: "Change status for No Man's Sky: Queued", exact: true }).click();
    await page.getByLabel("New gaming quest", { exact: true }).fill("Discover a new planet");
    await page.getByRole("button", { name: "Add quest", exact: true }).click();
    await page.reload();
    assert.equal(await page.getByRole("button", { name: "Change status for No Man's Sky: Playing", exact: true }).count(), 1);
    assert.equal(await page.getByLabel("Discover a new planet", { exact: true }).isChecked(), false);
    await switchTo("Study");
    assert.equal(await page.getByLabel("Revise orbital mechanics", { exact: true }).isChecked(), true);
    assert.match(await page.locator(".recall-card").innerText(), /What holds planets/);
    await page.getByRole("button", { name: "Edit widgets", exact: true }).click();
    await page.getByRole("switch", { name: "Recall orbit", exact: true }).click();
    await page.reload();
    assert.equal(await page.locator(".study-cards").count(), 0);

    // Simulate a pre-upgrade installation and preserve its existing data.
    await page.evaluate(() => {
      const profiles = JSON.parse(localStorage.getItem("orbital-profiles"));
      const study = profiles.find(p => p.name === "Study");
      delete study.widgetVersion;
      study.widgets = ["notes", "focus"];
      study.notes = "Keep my old notes";
      localStorage.setItem("orbital-profiles", JSON.stringify(profiles));
    });
    await page.reload();
    assert.equal(await page.locator(".study-cards").count(), 1);
    assert.equal(await page.getByLabel("Quick notes", { exact: true }).inputValue(), "Keep my old notes");
    const backup = await page.evaluate(() => {
      const study = JSON.parse(localStorage.getItem("orbital-profiles")).find(p => p.name === "Study");
      return JSON.stringify({ version: 1, profiles: [{ ...study, name: "Study backup" }] });
    });
    await page.locator('input[accept="application/json"]').setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(backup) });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("orbital-profiles")).some(p => p.name === "Study backup"));
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("orbital-profiles")).find(p => p.name === "Study backup"));
    assert.equal(restored.widgetData.flashcards[0].answer, "Gravity");
    assert.equal(restored.widgetData.studyMissions[0].done, true);
    assert.ok(restored.widgets.includes("study-cards"));
    await page.setViewportSize({ width: 390, height: 700 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.reload();
    await page.waitForSelector(".orbit-waiting", { state: "attached" });
    await page.locator(".discovery").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".discovery")?.classList.contains("orbit-revealed"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => !document.querySelector(".orbit-waiting"));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
