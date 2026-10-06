import { Email } from "../value-objects/Email";
import { AppError } from "../../shared/errors/AppError";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";

export type UserProps = {
  // Core Identity
  id: string;
  email: Email;
  firstName: string;
  lastName: string;
  password: string;

  // Optional Profile Info
  role?: string;
  mobile?: string | null;
  profileImage?: string | null;
  googleId?: string | null;

  // Account Status
  isBlocked?: boolean;

  // Metadata
  createdAt?: Date;
  lastActiveAt?: Date | null;
};

type UserState = {
  id: string;
  email: Email;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  mobile: string | null;
  profileImage: string | null;
  googleId: string | null;
  isBlocked: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
};

export class User {
  private constructor(private readonly props: UserState) { }

  static create(props: UserProps): User {
    if (!props.id) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    if (!props.email) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    if (!props.firstName) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    if (!props.lastName) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    if (!props.password) throw new AppError(ErrorCodes.VALIDATION_FAILED);

    return new User({
      id: props.id,
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      password: props.password,
      role: props.role ?? "USER",
      mobile: props.mobile ?? null,
      profileImage: props.profileImage ?? null,
      googleId: props.googleId ?? null,
      isBlocked: props.isBlocked ?? false,
      createdAt: props.createdAt ?? new Date(),
      lastActiveAt: props.lastActiveAt ?? null,
    });
  }



  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get mobile(): string | null {
    return this.props.mobile;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get googleId(): string | null {
    return this.props.googleId;
  }

  get password(): string {
    return this.props.password;
  }

  get profileImage(): string | null {
    return this.props.profileImage;
  }

  get isBlocked(): boolean {
    return this.props.isBlocked;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastActiveAt(): Date | null {
    return this.props.lastActiveAt;
  }

  public markAsActive(): void {
    this.props.lastActiveAt = new Date();
  }

  get role(): string {
    return this.props.role;
  }

}
