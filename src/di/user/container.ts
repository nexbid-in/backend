import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUserProfileUseCase } from "../../application/use-cases/user/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "../../application/use-cases/user/UpdateUserProfileUseCase";
import { CloudinarySignatureService } from "../../infrastructure/services/cloudinary/CloudinarySignatureService";
import { UserController } from "../../presentation/http/controllers/user/UserController";

const userRepository = new UserRepository();
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
const signatureService = new CloudinarySignatureService();

export const userController = new UserController(
  getUserProfileUseCase,
  updateUserProfileUseCase,
  signatureService
);
