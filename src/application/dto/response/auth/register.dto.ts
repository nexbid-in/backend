

export type UserRegisterResponseDTO = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};
