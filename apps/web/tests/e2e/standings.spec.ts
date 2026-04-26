import { test, expect } from "@playwright/test"

test.describe("League Standings page (Objective 3)", () => {
  test("loads /standings with HTTP 200", async ({ page }) => {
    const response = await page.goto("/standings")
    expect(response?.status()).toBe(200)
  })

  test("renders standings table headers", async ({ page }) => {
    await page.goto("/standings")
    await expect(page.locator("text=/Team/i").first()).toBeVisible()
    await expect(page.locator("text=/^PTS$/i").first()).toBeVisible()
  })

  test("displays known Uruguayan team names", async ({ page }) => {
    await page.goto("/standings")
    const knownTeams = ["Peñarol", "Nacional", "Defensor", "Liverpool", "Danubio"]
    const body = (await page.textContent("body")) ?? ""
    const matches = knownTeams.filter((name) => body.includes(name))
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })
})
