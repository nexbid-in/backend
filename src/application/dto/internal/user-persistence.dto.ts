

export type UserPersistenceDTO = {
  // Core identity
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  dob: Date;
  pinHash: string;

  // Optional profile
  gender: string | null;
  incomeRange: number | null;
  occupation: string | null;
  permanentAddress: string | null;
  correspondenceAddress: string | null;
  profileImage: string | null;

  // Account status
  isActive: boolean;
  isBlocked: boolean;
  isBanned: boolean;

  // Metadata
  createdAt: Date;
};
