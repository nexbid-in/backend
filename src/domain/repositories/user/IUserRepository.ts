import { User } from "../../entities/User";


export interface IUserRepository {
    existsByEmail(email: string): Promise<boolean>;
    existsByMobile(email: string): Promise<boolean>;
    existsById(id: string): Promise<boolean>;
    save(user: User): Promise<void>;
}