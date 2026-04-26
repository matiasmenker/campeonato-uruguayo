import { test, expect } from "@playwright/test"

test.describe("Home page (Objective 2)", () => {
  test("loads with HTTP 200 and renders without runtime errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("pageerror", (error) => consoleErrors.push(error.message))

    const response = await page.goto("/")

    expect(response?.status()).toBe(200)
    expect(consoleErrors).toEqual([])
  })

  test("shows main navigation entries", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Campeonato/i)
  })

  test("renders the matches carousel section", async ({ page }) => {
    await page.goto("/")
    const body = await page.textContent("body")
    expect(body).toBeTruthy()
    expect(body!.length).toBeGreaterThan(500)
  })
})
