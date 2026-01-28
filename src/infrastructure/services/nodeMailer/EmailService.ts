import { IEmailService } from "../../../application/interface/services/IEmailService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { logger } from "../../logging/logger";
import { mailTransporter } from "./NodeMailerTransport";

export class EmailService implements IEmailService {
  async sendOtp(email: string, subject: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Your OTP Code</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this, please ignore.</p>
        </div>
      `,
    };

    try {
      const info = await mailTransporter.sendMail(
        mailOptions
      );

      logger.info(
        {
          email,
          messageId: info.messageId,
          otp
        },
        "OTP email sent"
      );
    } catch (error: unknown) {
      logger.error(
        { error, email },
        "Failed to send OTP email"
      );
      throw new AppError(ErrorCodes.EMAIL_SEND_FAILED);
    }
  }
}
