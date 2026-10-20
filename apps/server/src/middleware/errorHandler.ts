import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof Error && "statusCode" in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    res.status(statusCode).json({ error: error.message });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
}
