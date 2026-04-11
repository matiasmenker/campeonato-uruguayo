import type { Request, Response, NextFunction } from "express";
import type { AppConfig } from "../config/index.js";
export const securityHeaders = (
  _request: Request,
  response: Response,
  next: NextFunction
): void => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("X-XSS-Protection", "0");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.removeHeader("X-Powered-By");
  next();
};
export const apiKeyAuth = (config: AppConfig) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!config.apiKey) {
      next();
      return;
    }
    if (request.path === "/" || request.path === "/health") {
      next();
      return;
    }
    const providedKey = request.headers["x-api-key"];
    if (!providedKey || providedKey !== config.apiKey) {
      response.status(401).json({
        error: {
          code: "unauthorized",
          message: "Invalid or missing API key",
          details: null,
        },
      });
      return;
    }
    next();
  };
};
export const rateLimiter = (config: AppConfig) => {
  const windowMs = config.rateLimitWindowMs;
  const maxRequests = config.rateLimitMaxRequests;
  const store = new Map<string, number[]>();
  const cleanupIntervalMs = 120000;
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of store) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(ip);
      } else {
        store.set(ip, valid);
      }
    }
  }, cleanupIntervalMs);
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
  return (request: Request, response: Response, next: NextFunction): void => {
    const ip = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const timestamps = store.get(ip) ?? [];
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length >= maxRequests) {
      const oldestValid = valid[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldestValid)) / 1000);
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.setHeader("X-RateLimit-Limit", String(maxRequests));
      response.setHeader("X-RateLimit-Remaining", "0");
      response.status(429).json({
        error: {
          code: "rate_limit_exceeded",
          message: "Too many requests, please try again later",
          details: { retryAfterSeconds },
        },
      });
      return;
    }
    valid.push(now);
    store.set(ip, valid);
    response.setHeader("X-RateLimit-Limit", String(maxRequests));
    response.setHeader("X-RateLimit-Remaining", String(maxRequests - valid.length));
    next();
  };
};
