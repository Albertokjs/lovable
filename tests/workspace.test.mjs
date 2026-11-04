import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

test("persistent workspaces, navigation, themes, notes, timer and responsive layout", async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:5173");
    await page
      .getByRole("heading", { name: "A little space. Endless possibilities." })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Quick notes" })
      .fill("Personal nebula research");
    await page.locator(".profile").filter({ hasText: "Study" }).click();
    assert.equal(
      await page.getByRole("textbox", { name: "Quick notes" }).inputValue(),
      "",
    );
    await page
      .getByRole("textbox", { name: "Quick notes" })
      .fill("Study orbital mechanics");
    await page.reload();
    assert.equal(
      await page.getByRole("textbox", { name: "Quick notes" }).inputValue(),
      "Study orbital mechanics",
    );
    await page.locator(".profile").filter({ hasText: "Personal" }).click();
    assert.equal(
      await page.getByRole("textbox", { name: "Quick notes" }).inputValue(),
      "Personal nebula research",
    );
    await page.getByRole("button", { name: "Customize", exact: true }).click();
    await page.locator(".theme-card").filter({ hasText: "Aurora" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
    assert.equal(
      await page
        .locator(".app")
        .evaluate((el) => el.style.getPropertyValue("--accent")),
      "#6cdbbf",
    );
    await page.getByRole("button", { name: "Start focus" }).click();
    await page.waitForTimeout(1100);
    assert.notEqual(await page.locator(".timer-value").innerText(), "25:00");
    await page.getByRole("button", { name: "Pause session" }).click();
    await page
      .getByRole("textbox", { name: "Search the web", exact: true })
      .fill("example.com");
    await page
      .getByRole("textbox", { name: "Search the web", exact: true })
      .press("Enter");
    assert.equal(
      await page
        .getByRole("link", { name: "Open website" })
        .getAttribute("href"),
      "https://example.com",
    );
    await page.getByRole("button", { name: "Bookmark current tab" }).click();
    await page.getByRole("button", { name: "Go to dashboard" }).click();
    await page
      .getByRole("button", { name: "New workspace", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Workspace name" })
      .fill("Research");
    await page.getByRole("button", { name: "Create", exact: false }).click();
    assert.equal(await page.locator(".profile.active").innerText(), "Research");
    await page.keyboard.press("Control+k");
    await page
      .getByRole("textbox", { name: "Search commands" })
      .fill("new tab");
    await page.getByRole("button", { name: "Open a new tab" }).click();
    assert.equal(await page.locator(".tab").count(), 2);
    await page.screenshot({
      path: "/workspace/desktop-preview.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await page.screenshot({
      path: "/workspace/mobile-preview.png",
      fullPage: true,
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
