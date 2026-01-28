

export interface IOtpService {
    generate(): string;
    hash(otp: string): Promise<string>;
    compare(otp: string, hash: string): Promise<boolean>;
}