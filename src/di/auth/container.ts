import { RedisOtpSessionService } from "../../infrastructure/redis/RedisOtpSessionService";
import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { RedisRateLimiter } from "../../infrastructure/redis/RedisRateLimiter";
import { OtpService } from "../../infrastructure/services/otp/OtpService";
import { EmailService } from "../../infrastructure/services/nodeMailer/EmailService";
import { AuthTokenService } from "../../infrastructure/services/jwt/AuthTokenService";
import { PasswordHashService } from "../../infrastructure/services/hashing/PasswordHashService";
import { UserIdGenerator } from "../../infrastructure/services/idGenerator/UserIdGenerator";
import { UniqueUserIdService } from "../../infrastructure/services/idGenerator/UniqueUserIdService";
import { GoogleAuthService } from "../../infrastructure/services/google/GoogleAuthService";
import { RedisUserActivityService } from "../../infrastructure/redis/RedisUserActivityService";

import { OtpDispatchService } from "../../application/services/auth/OtpDispatchService";
import { OtpVerificationService } from "../../application/services/auth/OtpVerificationService";
import { AuthSessionService } from "../../application/services/auth/AuthSessionService";

import { RegisterUserUseCase } from "../../application/use-cases/auth/RegisterUserUseCase";
import { VerifyEmailAndCreateAccountUseCase } from "../../application/use-cases/auth/VerifyEmailAndCreateAccountUseCase";
import { ResendOtpUseCase } from "../../application/use-cases/auth/ResendOtpUseCase";
import { LoginUserUseCase } from "../../application/use-cases/auth/LoginUserUseCase";
import { GetCurrentUserUseCase } from "../../application/use-cases/auth/GetCurrentUserUseCase";
import { SendPasswordResetOtpUseCase } from "../../application/use-cases/auth/SendPasswordResetOtpUseCase";
import { VerifyOtpAndResetPasswordUseCase } from "../../application/use-cases/auth/VerifyOtpAndResetPasswordUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/RefreshTokenUseCase";
import { GoogleAuthUseCase } from "../../application/use-cases/auth/GoogleAuthUseCase";

import { AuthController } from "../../presentation/http/controllers/auth/AuthController";
import { createAuthMiddleware } from "../../presentation/http/middlewares/authMiddleware";

const userRepository = new UserRepository();
const redisOtpSessionService = new RedisOtpSessionService();
const otpService = new OtpService();
const emailService = new EmailService();
const authTokenService = new AuthTokenService();
const passwordHashService = new PasswordHashService();
const userIdGenerator = new UserIdGenerator();
const redisRateLimiter = new RedisRateLimiter();
const googleAuthService = new GoogleAuthService();

const uniqueUserIdService = new UniqueUserIdService(
  userRepository,
  userIdGenerator
);

const redisUserActivityService = new RedisUserActivityService(userRepository);

const otpDispatchService = new OtpDispatchService(
  redisOtpSessionService,
  otpService,
  emailService,
  redisRateLimiter
);

const otpVerificationService = new OtpVerificationService(
  redisOtpSessionService,
  otpService
);

const authSessionService = new AuthSessionService(authTokenService);

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordHashService,
  otpDispatchService
);

const verifyEmailAndCreateAccountUseCase = new VerifyEmailAndCreateAccountUseCase(
  otpVerificationService,
  userRepository,
  uniqueUserIdService,
  authSessionService
);

const resendOtpUseCase = new ResendOtpUseCase(
  redisOtpSessionService,
  otpDispatchService
);

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  passwordHashService,
  authSessionService,
  redisRateLimiter
);

const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

const sendPasswordResetOtpUseCase = new SendPasswordResetOtpUseCase(
  userRepository,
  otpDispatchService
);

const verifyOtpAndResetPasswordUseCase = new VerifyOtpAndResetPasswordUseCase(
  otpVerificationService,
  userRepository,
  passwordHashService
);

const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepository,
  authTokenService,
  authSessionService
);

const googleAuthUseCase = new GoogleAuthUseCase(
  googleAuthService,
  userRepository,
  uniqueUserIdService,
  authSessionService
);

export const authMiddleware = createAuthMiddleware(
  authTokenService,
  redisUserActivityService
);

export const authController = new AuthController(
  registerUserUseCase,
  verifyEmailAndCreateAccountUseCase,
  resendOtpUseCase,
  loginUserUseCase,
  getCurrentUserUseCase,
  sendPasswordResetOtpUseCase,
  verifyOtpAndResetPasswordUseCase,
  refreshTokenUseCase,
  googleAuthUseCase
);
