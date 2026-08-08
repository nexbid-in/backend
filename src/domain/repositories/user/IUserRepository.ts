import { User } from "../../entities/User";
import { IBaseRepository } from "../IBaseRepository";


export interface IUserRepository extends IBaseRepository<User> {
    existsByEmail(email: string): Promise<boolean>;
    save(user: User): Promise<void>;
}