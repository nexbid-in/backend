import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IEmailService } from "../../interface/services/IEmailService";
import { IOtpService } from "../../interface/services/IOtpService";
import {
  IOtpSessionService,
  OtpSessionData,
} from "../../interface/services/IOtpSessionService";
import { IRateLimiter } from "../../interface/services/IRateLimiter";

/**
 * Enforces OTP rate limits, generates/hashes OTP codes, stores session payloads,
 * and dispatches OTP verification emails.
 */
export class OtpDispatchService {
  constructor(
    private readonly otpSessionService: IOtpSessionService,
    private readonly otpService: IOtpService,
    private readonly emailService: IEmailService,
    private readonly rateLimiter: IRateLimiter
  ) {}

  async checkRateLimit(
    rateLimitKey: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<void> {
    const isAllowed = await this.rateLimiter.incrementAndCheck(
      rateLimitKey,
      maxRequests,
      windowSeconds
    );

    if (!isAllowed) {
      throw new AppError(ErrorCodes.OTP_RATE_LIMIT_EXCEEDED);
    }
  }

  async generateAndSendOtp(params: {
    email: string;
    subject: string;
    sessionData?: OtpSessionData;
  }): Promise<void> {
    const otp = this.otpService.generate();
    const otpHash = await this.otpService.hash(otp);

    await this.otpSessionService.save(params.email, otpHash, params.sessionData);
    await this.emailService.sendOtp(params.email, params.subject, otp);
  }
}
