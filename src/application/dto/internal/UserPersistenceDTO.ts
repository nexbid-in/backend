export type UserPersistenceDTO = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string | null;
  role: string;
  mobile: string | null;
  profileImage: string | null;
  googleId: string | null;
  isBlocked: boolean;
  createdAt: Date;
  lastActiveAt: Date | null;
};
