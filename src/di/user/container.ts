import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUserProfileUseCase } from "../../application/use-cases/user/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "../../application/use-cases/user/UpdateUserProfileUseCase";
import { GetUploadSignatureUseCase } from "../../application/use-cases/user/GetUploadSignatureUseCase";
import { ChangePasswordUseCase } from "../../application/use-cases/user/ChangePasswordUseCase";
import { CloudinarySignatureService } from "../../infrastructure/services/cloudinary/CloudinarySignatureService";
import { PasswordHashService } from "../../infrastructure/services/hashing/PasswordHashService";
import { UserController } from "../../presentation/http/controllers/user/UserController";

const userRepository = new UserRepository();
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const signatureService = new CloudinarySignatureService();
const getUploadSignatureUseCase = new GetUploadSignatureUseCase(signatureService);
const passwordHashService = new PasswordHashService();
const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordHashService);

export const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  getUploadSignatureUseCase,
  changePasswordUseCase
);
