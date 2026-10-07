import { User } from "../../entities/User";
import { IBaseRepository } from "../IBaseRepository";

export interface UserQueryOptions {
    page: number;
    limit: number;
    search?: string;
    status?: "ALL" | "ACTIVE" | "BLOCKED";
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
}

export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    save(user: User): Promise<void>;
    findManyWithFilters(options: UserQueryOptions): Promise<PaginatedResult<User>>;
}