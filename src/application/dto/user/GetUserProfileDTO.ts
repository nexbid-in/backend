export type GetUserProfileRequestDTO = {
  userId: string;
};

export type GetUserProfileResponseDTO = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  profileImage: string | null;
  createdAt: Date;
  hasPassword: boolean;
  isGoogleLinked: boolean;
};
