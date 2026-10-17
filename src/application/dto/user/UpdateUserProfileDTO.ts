import { GetUserProfileResponseDTO } from "./GetUserProfileDTO";

export type UpdateUserProfileRequestDTO = {
  userId: string;
  firstName?: string;
  lastName?: string;
  mobile?: string | null;
  profileImage?: string | null;
};

export type UpdateUserProfileResponseDTO = GetUserProfileResponseDTO;
