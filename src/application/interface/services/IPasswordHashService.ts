

export interface IPasswordHashService {
    hash(pin: string): Promise<string>;
}