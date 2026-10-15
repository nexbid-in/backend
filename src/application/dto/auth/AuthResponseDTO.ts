
export type AuthResponseDTO = {
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage: string | null;
  };
};
