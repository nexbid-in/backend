
export interface IAuthTokenService {
    generate(payload: IAuthTokenServiceInput): string;
    verify(token: string): IAuthTokenServiceInput;
}

export interface IAuthTokenServiceInput {
    userId: string;
    email: string;
}