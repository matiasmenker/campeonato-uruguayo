import { test, expect } from "@playwright/test"

test.describe("Team Details page (Objective 5)", () => {
  test("loads /teams/14 with HTTP 200", async ({ page }) => {
    const response = await page.goto("/teams/14")
    expect(response?.status()).toBe(200)
  })

  test("renders team hero section with substantial content", async ({ page }) => {
    await page.goto("/teams/14")
    const body = (await page.textContent("body")) ?? ""
    expect(body.length).toBeGreaterThan(800)
  })

  test("does not produce runtime errors in console", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto("/teams/14")
    await page.waitForLoadState("domcontentloaded")
    expect(errors).toEqual([])
  })
})
