

export type UserRegisterResponseDTO = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
};
