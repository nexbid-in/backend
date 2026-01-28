

export interface IVerifyEmailOtpUseCse {
    execute(input: IVerifyEmailOtpInput): Promise<IVerifyEmailOtpOutput>;
}

export interface IVerifyEmailOtpInput {
    email: string;
    otp: string;
}

export interface IVerifyEmailOtpOutput {
    registrationToken: string;
}