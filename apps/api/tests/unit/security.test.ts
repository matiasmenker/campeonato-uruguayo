import { describe, it, expect, vi } from "vitest"
import type { Request, Response, NextFunction } from "express"
import { apiKeyAuth, securityHeaders } from "../../src/http/security.js"

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    path: "/api/v1/standings",
    headers: {},
    ...overrides,
  }) as unknown as Request

const buildResponse = (): Response => {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json: vi.fn(function (this: Response & { _body?: unknown }, body: unknown) {
      this._body = body
      return this
    }),
    setHeader(name: string, value: string) {
      this.headers[name] = value
    },
    removeHeader(name: string) {
      delete this.headers[name]
    },
  }
  return response as unknown as Response
}

describe("apiKeyAuth", () => {
  it("passes through requests when no apiKey is configured", () => {
    const middleware = apiKeyAuth({ apiKey: undefined } as never)
    const next = vi.fn() as NextFunction
    middleware(buildRequest(), buildResponse(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("allows public root path '/' without API key", () => {
    const middleware = apiKeyAuth({ apiKey: "secret" } as never)
    const next = vi.fn() as NextFunction
    middleware(buildRequest({ path: "/" }), buildResponse(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("allows public '/health' path without API key", () => {
    const middleware = apiKeyAuth({ apiKey: "secret" } as never)
    const next = vi.fn() as NextFunction
    middleware(buildRequest({ path: "/health" }), buildResponse(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it("rejects request with missing API key", () => {
    const middleware = apiKeyAuth({ apiKey: "secret" } as never)
    const response = buildResponse()
    const next = vi.fn() as NextFunction
    middleware(buildRequest(), response, next)
    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(401)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "unauthorized" }),
      })
    )
  })

  it("rejects request with wrong API key", () => {
    const middleware = apiKeyAuth({ apiKey: "secret" } as never)
    const response = buildResponse()
    const next = vi.fn() as NextFunction
    middleware(buildRequest({ headers: { "x-api-key": "wrong" } }), response, next)
    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(401)
  })

  it("accepts request with correct API key", () => {
    const middleware = apiKeyAuth({ apiKey: "secret" } as never)
    const response = buildResponse()
    const next = vi.fn() as NextFunction
    middleware(buildRequest({ headers: { "x-api-key": "secret" } }), response, next)
    expect(next).toHaveBeenCalledOnce()
    expect(response.statusCode).toBe(200)
  })
})

describe("securityHeaders", () => {
  it("sets recommended security headers", () => {
    const response = buildResponse()
    const next = vi.fn() as NextFunction
    securityHeaders({} as Request, response, next)
    expect(next).toHaveBeenCalledOnce()
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(response.headers["X-Frame-Options"]).toBe("DENY")
    expect(response.headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(response.headers["Strict-Transport-Security"]).toContain("max-age=")
  })

  it("removes X-Powered-By header to reduce server fingerprinting", () => {
    const response = buildResponse() as Response & { headers: Record<string, string> }
    response.headers["X-Powered-By"] = "Express"
    const next = vi.fn() as NextFunction
    securityHeaders({} as Request, response, next)
    expect(response.headers["X-Powered-By"]).toBeUndefined()
  })
})
