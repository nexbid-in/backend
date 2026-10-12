import { Prisma } from "./generated/prisma/client";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";
import { logger } from "../logging/logger";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {

    // P2025: Record to update/delete does not exist
    if (error.code === "P2025") {
      throw new AppError(ErrorCodes.NOT_FOUND);
    }

    // Log any other unmapped Prisma errors with context
    logger.error({ err: error, prismaCode: error.code }, "Prisma database error");
  }

  // If it is not a known Prisma error, re-throw it
  throw error;
}
