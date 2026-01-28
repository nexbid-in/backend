

export interface IUserIdGenerator {
    generate(fullName: string): string;
}

export interface IUniqueUserIdService {
    generate(name: string): Promise<string>;
}