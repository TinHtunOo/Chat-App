import type { NextFunction, Request, Response } from "express";
import { type ZodType } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodType, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    // Express 5 makes req.query read-only, so store parsed values separately
    if (source === "body") {
      req.body = result.data;
    } else {
      res.locals[source] = result.data;
    }

    next();
  };
}
