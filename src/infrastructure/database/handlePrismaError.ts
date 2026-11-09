import { Prisma } from "./generated/prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";
import { logger } from "../logging/logger";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    logger.error({ err: error, prismaCode: error.code }, "Prisma database error");
  }

  throw error;
}
