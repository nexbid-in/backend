
export interface IAuthTokenService {
    generate(payload: IAuthTokenServiceInput): string;
}

export interface IAuthTokenServiceInput {
    userId: string;
    email: string;
}