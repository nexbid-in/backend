import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUsersUseCase } from "../../application/use-cases/admin/GetUsersUseCase";
import { AdminUserController } from "../../presentation/http/controllers/admin/AdminUserController";

const userRepository = new UserRepository();
const getUsersUseCase = new GetUsersUseCase(userRepository);

export const adminUserController = new AdminUserController(getUsersUseCase);
