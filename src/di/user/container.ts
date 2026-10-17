import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUserProfileUseCase } from "../../application/use-cases/user/GetUserProfileUseCase";
import { UserController } from "../../presentation/http/controllers/user/UserController";

const userRepository = new UserRepository();
const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);

export const userController = new UserController(getUserProfileUseCase);
