import { User } from "../../entities/User";
import { IBaseRepository } from "../IBaseRepository";


export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    save(user: User): Promise<void>;
}