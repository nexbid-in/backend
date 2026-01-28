import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * validater
 * @param schema zod object
 * @returns 
 */

export const zodValidate = (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
