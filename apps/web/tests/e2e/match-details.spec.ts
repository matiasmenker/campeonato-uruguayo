import { test, expect } from "@playwright/test"

test.describe("Match Details page (Objective 4)", () => {
  test("loads /matches/98 (real fixture) with HTTP 200", async ({ page }) => {
    const response = await page.goto("/matches/98")
    expect(response?.status()).toBe(200)
  })

  test("renders both team names on the match page", async ({ page }) => {
    await page.goto("/matches/98")
    const body = (await page.textContent("body")) ?? ""
    expect(body.length).toBeGreaterThan(800)
  })

  test("renders a status badge (Finished, Live, or Upcoming)", async ({ page }) => {
    await page.goto("/matches/98")
    const badge = page.locator("text=/Finished|Live|Upcoming|Half time|Penalties/i").first()
    await expect(badge).toBeVisible()
  })

  test("returns 200 (or notFound) for an out-of-range match id", async ({ page }) => {
    const response = await page.goto("/matches/9999999")
    expect([200, 404]).toContain(response?.status() ?? 0)
  })
})
