import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors.js";
import type { ErrorResponse } from "../contracts/error.js";
export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid request parameters",
        details: error.flatten().fieldErrors,
      },
    });
    return;
  }
  console.error("Unhandled error:", error);
  response.status(500).json({
    error: {
      code: "internal_server_error",
      message: "Internal server error",
      details: null,
    },
  });
};
