import { UserRepository } from "../../infrastructure/repositories/user/UserRepository";
import { GetUsersUseCase } from "../../application/use-cases/admin/GetUsersUseCase";
import { AdminUserController } from "../../presentation/http/controllers/admin/AdminUserController";
import { UpdateUserStatusUseCase } from "../../application/use-cases/admin/UpdateUserStatusUseCase";

const userRepository = new UserRepository();
const getUsersUseCase = new GetUsersUseCase(userRepository);
const updateUserStatusUseCase = new UpdateUserStatusUseCase(userRepository);

export const adminUserController = new AdminUserController(getUsersUseCase, updateUserStatusUseCase);
