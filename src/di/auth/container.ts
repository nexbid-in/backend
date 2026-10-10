import { RedisOtpSessionService } from "../../infrastructure/redis/RedisOtpSessionService";
import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";

import { RedisRateLimiter } from "../../infrastructure/redis/RedisRateLimiter";
import { OtpService } from "../../infrastructure/services/otp/OtpService";
import { EmailService } from "../../infrastructure/services/nodeMailer/EmailService";
import { AuthTokenService } from "../../infrastructure/services/jwt/AuthTokenService";
import { PasswordHashService } from "../../infrastructure/services/hashing/PasswordHashService";
import { UserIdGenerator } from "../../infrastructure/services/idGenerator/UserIdGenerator";
import { UniqueUserIdService } from "../../infrastructure/services/idGenerator/UniqueUserIdService";

import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase";
import { VerifyEmailAndCreateAccountUseCase } from "../../application/use-cases/auth/VerifyEmailAndCreateAccountUseCase";
import { ResendOtpUseCase } from "../../application/use-cases/auth/ResendOtpUseCase";
import { LoginUserUseCase } from "../../application/use-cases/auth/LoginUserUseCase";
import { GetCurrentUserUseCase } from "../../application/use-cases/auth/GetCurrentUserUseCase";
import { SendPasswordResetOtpUseCase } from "../../application/use-cases/auth/SendPasswordResetOtpUseCase";
import { VerifyOtpAndResetPasswordUseCase } from "../../application/use-cases/auth/VerifyOtpAndResetPasswordUseCase";

import { AuthController } from "../../presentation/http/controllers/auth/AuthController";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/RefreshTokenUseCase";


const userRepository = new UserRepository();
const redisOtpSessionService = new RedisOtpSessionService();
const otpService = new OtpService();
const emailService = new EmailService();
const authTokenService = new AuthTokenService();
const passwordHashService = new PasswordHashService();
const userIdGenerator = new UserIdGenerator();
const uniqueUserIdService = new UniqueUserIdService(userRepository, userIdGenerator);
const redisRateLimiter = new RedisRateLimiter();

const registerUserUseCase = new RegisterUserUseCase(userRepository, redisOtpSessionService, otpService, emailService, passwordHashService, redisRateLimiter);
const verifyEmailAndCreateAccountUseCase = new VerifyEmailAndCreateAccountUseCase(redisOtpSessionService, otpService, userRepository, uniqueUserIdService, authTokenService);
const resendOtpUseCase = new ResendOtpUseCase(redisOtpSessionService, otpService, emailService, redisRateLimiter);
const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHashService, authTokenService, redisRateLimiter);
const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
const sendPasswordResetOtpUseCase = new SendPasswordResetOtpUseCase(userRepository, redisOtpSessionService, otpService, emailService, redisRateLimiter);
const verifyOtpAndResetPasswordUseCase = new VerifyOtpAndResetPasswordUseCase(redisOtpSessionService, otpService, userRepository, passwordHashService);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, authTokenService);

export const authController = new AuthController(registerUserUseCase, verifyEmailAndCreateAccountUseCase, resendOtpUseCase, loginUserUseCase, getCurrentUserUseCase, sendPasswordResetOtpUseCase, verifyOtpAndResetPasswordUseCase, refreshTokenUseCase);
