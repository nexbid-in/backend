export type UserPersistenceDTO = {
  // Core identity
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  
  // Optional profile
  password: string | null;
  role: string;
  mobile: string | null;
  profileImage: string | null;
  googleId: string | null;

  // Account status
  isBlocked: boolean;

  // Metadata
  createdAt: Date;
  lastActiveAt: Date | null;
};
