import { RedisTempUserRepository } from "../../../infrastructure/redis/RedisTempUserRepository";
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

import { AuthController } from "../../../presentation/http/controllers/user/AuthController";


const userRepository = new UserRepository();
const redisTempUserRepository = new RedisTempUserRepository();
const otpService = new OtpService();
const emailService = new EmailService();
const authTokenService = new AuthTokenService();
const passwordHashService = new PasswordHashService();
const userIdGenerator = new UserIdGenerator();
const uniqueUserIdService = new UniqueUserIdService(userRepository, userIdGenerator);
const redisRateLimiter = new RedisRateLimiter();

const registerUserUseCase = new RegisterUserUseCase(userRepository, redisTempUserRepository, otpService, emailService, passwordHashService, redisRateLimiter);
const verifyEmailAndCreateAccountUseCase = new VerifyEmailAndCreateAccountUseCase(redisTempUserRepository, otpService, userRepository, uniqueUserIdService, authTokenService);
const resendOtpUseCase = new ResendOtpUseCase(redisTempUserRepository, otpService, emailService, redisRateLimiter);

export const authController = new AuthController(registerUserUseCase, verifyEmailAndCreateAccountUseCase, resendOtpUseCase);





