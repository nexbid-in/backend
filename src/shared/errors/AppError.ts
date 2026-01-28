import { ErrorCodes } from "./ErrorCodes";

export class AppError extends Error {
  public readonly code: ErrorCodes;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCodes,
    message?: string
  ) {
    super(message);
    this.code = code;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
