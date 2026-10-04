
export type LoginUserDTO = {
    email: string;
    password: string;
    portal?: "USER" | "ADMIN";
}