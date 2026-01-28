

export interface IRegistrationTokenService {
    generate(email: string): string;
    verify(token: string): IRegistrationVerifyTokenOutput;
}

export interface IRegistrationVerifyTokenOutput {
    email: string;
}

export interface IAuthTokenService {
    generate(payload: IAuthTokenServiceInput): string;
}

export interface IAuthTokenServiceInput {
    userId: string;
    email: string;
}