import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: (result.error as ZodError).flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
