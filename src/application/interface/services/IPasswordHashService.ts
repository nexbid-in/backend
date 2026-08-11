

export interface IPasswordHashService {
    hash(password: string): Promise<string>;
    compare(plain: string, hash: string): Promise<boolean>;
}