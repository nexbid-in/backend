
export interface OtpSessionData {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
    purpose?: "RESET_PASSWORD";
}

export interface IOtpSessionService {
    save(email: string, otpHash: string, data?: OtpSessionData): Promise<void>;
    get(email: string): Promise<{ otpHash: string; attempts: number; data?: OtpSessionData } | null>;
    incrementAttempts(email: string): Promise<void>;
    delete(email: string): Promise<void>;
}