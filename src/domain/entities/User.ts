

export type UserProps = {
  // Core Identity
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  dob: Date;
  pinHash: string;

  // Optional Profile Info
  gender?: string;
  incomeRange?: number;
  occupation?: string;
  permanentAddress?: string;
  correspondenceAddress?: string;
  profileImage?: string;

  // Account Status
  isBlocked?: boolean;
  isBanned?: boolean;
  isActive?: boolean;

  // Metadata
  createdAt?: Date;
};

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {

    if (!props.id) throw new Error("User id is required");
    if (!props.email) throw new Error("Email is required");
    if (!props.mobile) throw new Error("Mobile is required");
    if (!props.fullName) throw new Error("Full name is required");
    if (!props.pinHash) throw new Error("PIN hash is required");

    if (props.pinHash.length < 20) {
      throw new Error("PIN must be hashed");
    }

    return new User({
      id: props.id,
      email: props.email.toLowerCase(),
      mobile: props.mobile,
      fullName: props.fullName,
      dob: props.dob,
      pinHash: props.pinHash, 
      gender: props.gender,
      incomeRange: props.incomeRange,
      occupation: props.occupation,
      permanentAddress: props.permanentAddress,
      correspondenceAddress: props.correspondenceAddress,
      profileImage: props.profileImage,
      isBlocked: props.isBlocked ?? false,
      isBanned: props.isBanned ?? false,
      isActive: props.isActive ?? true,
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

  get fullName() {
    return this.props.fullName;
  }

  get dob() {
    return this.props.dob;
  }

  get pinHash() {
    return this.props.pinHash;
  }

  get gender() {
    return this.props.gender;
  }

  get incomeRange() {
    return this.props.incomeRange;
  }

  get occupation() {
    return this.props.occupation;
  }

  get permanentAddress() {
    return this.props.permanentAddress;
  }

  get correspondenceAddress() {
    return this.props.correspondenceAddress;
  }

  get profileImage() {
    return this.props.profileImage;
  }

  get isActive() {
    return this.props.isActive ?? true;
  }

  get isBlocked() {
    return this.props.isBlocked ?? false;
  }

  get isBanned() {
    return this.props.isBanned ?? false;
  }

  get createdAt() {
    return this.props.createdAt ?? new Date();
  }
}
