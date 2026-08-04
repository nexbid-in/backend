import { RedisEmailOtpRepository } from "../../../infrastructure/redis/RedisEmailOtpRepository";
import { UserRepository } from "../../../infrastructure/repositories/user/UserRepository";

import { OtpService } from "../../../infrastructure/services/otp/OtpService";
import { EmailService } from "../../../infrastructure/services/nodeMailer/EmailService";
import { RegistrationTokenService } from "../../../infrastructure/services/jwt/RegistrationTokenService";
import { AuthTokenService } from "../../../infrastructure/services/jwt/AuthTokenService";
import { PinHashService } from "../../../infrastructure/services/pinHash/PinService";
import { UserIdGenerator } from "../../../infrastructure/services/idGenerator/UserIdGenerator";
import { UniqueUserIdService } from "../../../infrastructure/services/idGenerator/UniqueUserIdService";

import { StartEmailRegistrationUseCase } from "../../../application/use-cases/user/auth/StartEmailRegistrationUseCase";
import { VerifyEmailOtpUseCase } from "../../../application/use-cases/user/auth/VerifyEmailOtpUseCase";
import { ResendOtpUseCase } from "../../../application/use-cases/user/auth/ResendOtpUseCase";

import { AuthController } from "../../../interfaces/http/controllers/user/AuthController";


const userRepository = new UserRepository();
const redisEmailOtpRepository = new RedisEmailOtpRepository();
const otpService = new OtpService();
const emailService = new EmailService();
const registrationTokenService = new RegistrationTokenService();
const authTokenService = new AuthTokenService();
const pinHashService = new PinHashService();
const userIdGenerator = new UserIdGenerator();
const uniqueUserIdService = new UniqueUserIdService(userRepository, userIdGenerator);

const startEmailRegistrationUseCase = new StartEmailRegistrationUseCase(userRepository, redisEmailOtpRepository, otpService, emailService, pinHashService);
const verifyEmailOtpUseCase = new VerifyEmailOtpUseCase(redisEmailOtpRepository, otpService, userRepository, uniqueUserIdService, authTokenService);
const resendOtpUseCase = new ResendOtpUseCase(userRepository, redisEmailOtpRepository, otpService, emailService);

export const authController = new AuthController(startEmailRegistrationUseCase, verifyEmailOtpUseCase, resendOtpUseCase);





