

export interface IEmailService {
    sendOtp(email: string, subject: string, otp: string): Promise<void>;
}