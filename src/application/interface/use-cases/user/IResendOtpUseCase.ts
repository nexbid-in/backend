
export interface IResendOtpInput {
    email: string;
}

export interface IResendOtpUseCase {
    execute(input: IResendOtpInput): Promise<void>;
}