import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export class Email {
  private constructor(
    private readonly value: string
  ) {}

  public static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new AppError(ErrorCodes.INVALID_EMAIL)
    }

    return new Email(email);
  }

  private static isValid(email: string): boolean {
    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);
  }

  public getValue(): string {
    return this.value;
  }
}
