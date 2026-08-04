
export interface ITempRegistrationData {
    firstName: string;
    lastName: string;
    passwordHash: string;
}

export interface IEmailOtpRepository {
    save(email: string, otpHash: string, data: ITempRegistrationData): Promise<void>;
    exists(email: string): Promise<boolean>;
    get(email: string): Promise<{ otpHash: string; attempts: number; data: ITempRegistrationData } | null>;
    incrementAttempts(email: string): Promise<void>;
    delete(email: string): Promise<void>;
}