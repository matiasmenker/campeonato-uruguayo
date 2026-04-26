import { describe, it, expect, beforeAll } from "vitest"
import { resolve } from "node:path"
import dotenv from "dotenv"
import request from "supertest"

dotenv.config({ path: resolve(__dirname, "../../../../.env") })

const hasDatabase = !!process.env.DATABASE_URL
const describeIfDb = hasDatabase ? describe : describe.skip

describeIfDb("API integration (requires DATABASE_URL)", () => {
  let app: import("express").Express

  beforeAll(async () => {
    const mod = await import("../../src/app.js")
    app = mod.default
  })

  describe("GET /", () => {
    it("returns service identification", async () => {
      const response = await request(app).get("/")
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        name: expect.any(String),
        version: expect.any(String),
        status: "running",
      })
    })

    it("does not require API key", async () => {
      const response = await request(app).get("/")
      expect(response.status).toBe(200)
    })
  })

  describe("GET /health", () => {
    it("returns healthy status when DB is reachable", async () => {
      const response = await request(app).get("/health")
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        status: "healthy",
        database: "connected",
        timestamp: expect.any(String),
      })
    })
  })

  describe("Authentication", () => {
    it("rejects protected endpoint without API key when API_KEY is configured", async () => {
      if (!process.env.API_KEY) return
      const response = await request(app).get("/api/v1/standings")
      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe("unauthorized")
    })

    it("accepts protected endpoint with correct API key", async () => {
      if (!process.env.API_KEY) return
      const response = await request(app)
        .get("/api/v1/standings")
        .set("x-api-key", process.env.API_KEY)
      expect(response.status).toBe(200)
    })
  })

  describe("GET /api/v1/standings", () => {
    it("returns a paginated list with expected shape", async () => {
      const response = await request(app)
        .get("/api/v1/standings")
        .set("x-api-key", process.env.API_KEY ?? "")
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        data: expect.any(Array),
      })
    })
  })

  describe("GET /api/v1/fixtures/:id", () => {
    it("returns a fixture detail with related entities", async () => {
      const list = await request(app)
        .get("/api/v1/fixtures?limit=1")
        .set("x-api-key", process.env.API_KEY ?? "")
      const firstFixture = list.body?.data?.[0]
      if (!firstFixture) return

      const detail = await request(app)
        .get(`/api/v1/fixtures/${firstFixture.id}`)
        .set("x-api-key", process.env.API_KEY ?? "")

      expect(detail.status).toBe(200)
      expect(detail.body.data).toMatchObject({
        id: expect.any(Number),
        homeTeam: expect.any(Object),
        awayTeam: expect.any(Object),
      })
    })

    it("returns 404 for unknown fixture id", async () => {
      const response = await request(app)
        .get("/api/v1/fixtures/9999999")
        .set("x-api-key", process.env.API_KEY ?? "")
      expect(response.status).toBe(404)
    })
  })

  describe("Security headers", () => {
    it("sets X-Content-Type-Options on every response", async () => {
      const response = await request(app).get("/")
      expect(response.headers["x-content-type-options"]).toBe("nosniff")
    })

    it("does not leak X-Powered-By", async () => {
      const response = await request(app).get("/")
      expect(response.headers["x-powered-by"]).toBeUndefined()
    })
  })
})
