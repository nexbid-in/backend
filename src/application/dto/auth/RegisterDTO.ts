
export type RegisterUserDTO = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export type VerifyEmailDTO = {
    email: string;
    otp: string;
}

export type ResendOtpDTO = {
    email: string;
}