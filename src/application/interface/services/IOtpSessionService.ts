
export interface UnverifiedUser {
    firstName: string;
    lastName: string;
    passwordHash: string;
}

export interface IOtpSessionService {
    save(email: string, otpHash: string, data: UnverifiedUser): Promise<void>;
    get(email: string): Promise<{ otpHash: string; attempts: number; data: UnverifiedUser } | null>;
    incrementAttempts(email: string): Promise<void>;
    delete(email: string): Promise<void>;
}