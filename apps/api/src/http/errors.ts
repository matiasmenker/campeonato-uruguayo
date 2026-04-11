export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown | null = null
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "resource_not_found", `${resource} not found`);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details: unknown | null = null) {
    super(400, "bad_request", message, details);
  }
}
