export type UserPersistenceDTO = {
  // Core identity
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;

  // Optional profile
  mobile: string | null;
  profileImage: string | null;
  googleId: string | null;

  // Account status
  isBlocked: boolean;

  // Metadata
  createdAt: Date;
};
