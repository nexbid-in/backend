import { Email } from "../value-objects/Email";


export type UserProps = {
  // Core Identity
  id: string;
  email: Email;
  firstName: string;
  lastName: string;
  password: string;

  // Optional Profile Info
  mobile?: string | null;
  profileImage?: string | null;
  googleId?: string | null;

  // Account Status
  isBlocked?: boolean;

  // Metadata
  createdAt?: Date;
};


export class User {
  private constructor(private readonly props: UserProps) { }

  static create(props: UserProps): User {
    if (!props.id) throw new Error("User id is required");
    if (!props.email) throw new Error("Email is required");
    if (!props.firstName) throw new Error("First name is required");
    if (!props.lastName) throw new Error("Last name is required");
    if (!props.password) throw new Error("Password is required");

    return new User({
      id: props.id,
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      password: props.password,
      mobile: props.mobile,
      profileImage: props.profileImage,
      googleId: props.googleId,
      isBlocked: props.isBlocked ?? false,
      createdAt: props.createdAt ?? new Date(),
    });
  }



  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get mobile() {
    return this.props.mobile;
  }

  get firstName() {
    return this.props.firstName;
  }

  get lastName() {
    return this.props.lastName;
  }

  get googleId() {
    return this.props.googleId;
  }

  get password() {
    return this.props.password;
  }

  get profileImage() {
    return this.props.profileImage;
  }

  get isBlocked() {
    return this.props.isBlocked ?? false;
  }

  get createdAt() {
    return this.props.createdAt ?? new Date();
  }
}
