import { RedisOtpSessionService } from "../../../infrastructure/redis/RedisOtpSessionService";
import { UserRepository } from "../../../infrastructure/repositories/user/UserRepository";

import { RedisRateLimiter } from "../../../infrastructure/redis/RedisRateLimiter";
import { OtpService } from "../../../infrastructure/services/otp/OtpService";
import { EmailService } from "../../../infrastructure/services/nodeMailer/EmailService";
import { AuthTokenService } from "../../../infrastructure/services/jwt/AuthTokenService";
import { PasswordHashService } from "../../../infrastructure/services/hashing/PasswordHashService";
import { UserIdGenerator } from "../../../infrastructure/services/idGenerator/UserIdGenerator";
import { UniqueUserIdService } from "../../../infrastructure/services/idGenerator/UniqueUserIdService";

import { RegisterUserUseCase } from "../../../application/use-cases/user/auth/RegisterUserUseCase";
import { VerifyEmailAndCreateAccountUseCase } from "../../../application/use-cases/user/auth/VerifyEmailAndCreateAccountUseCase";
import { ResendOtpUseCase } from "../../../application/use-cases/user/auth/ResendOtpUseCase";
import { LoginUserUseCase } from "../../../application/use-cases/user/auth/LoginUserUseCase";

import { AuthController } from "../../../presentation/http/controllers/user/AuthController";
import { GetCurrentUserUseCase } from "../../../application/use-cases/user/auth/GetCurrentUserUseCase";


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

export const authController = new AuthController(registerUserUseCase, verifyEmailAndCreateAccountUseCase, resendOtpUseCase, loginUserUseCase, getCurrentUserUseCase);





