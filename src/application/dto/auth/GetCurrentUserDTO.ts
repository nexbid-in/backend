export type GetCurrentUserRequestDTO = {
    userId: string;
}

export type GetCurrentUserResponseDTO = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}
