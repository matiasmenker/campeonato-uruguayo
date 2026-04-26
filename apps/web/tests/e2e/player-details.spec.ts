import { test, expect } from "@playwright/test"

test.describe("Player Details page (Objective 6)", () => {
  test("loads /players/1622 with HTTP 200", async ({ page }) => {
    const response = await page.goto("/players/1622")
    expect(response?.status()).toBe(200)
  })

  test("renders player profile content", async ({ page }) => {
    await page.goto("/players/1622")
    const body = (await page.textContent("body")) ?? ""
    expect(body.length).toBeGreaterThan(500)
  })
})
