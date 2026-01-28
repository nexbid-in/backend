import { InvalidEmailError } from "../errors/InvalidEmailError";

export class Email {
  private constructor(
    private readonly value: string
  ) {}

  public static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new InvalidEmailError(email);
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
