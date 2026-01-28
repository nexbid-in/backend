

export interface IEmailOtpRepository {
    save(email: string, otpHash: string): Promise<void>;
    exists(email: string): Promise<boolean>;
    get(email: string): Promise<{ otpHash: string; attempts: number } | null>;
    incrementAttempts(email: string): Promise<void>;
    delete(email: string): Promise<void>;
}