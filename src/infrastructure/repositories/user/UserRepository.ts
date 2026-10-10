import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { IUserRepository, PaginatedResult, UserQueryOptions } from "../../../domain/repositories/user/IUserRepository";
import { User } from "../../../domain/entities/User";
import { UserPersistenceMapper } from "../../../application/mapper/user/UserPersistenceMapper";
import { BaseRepository } from "../BaseRepository";
import { UserPersistenceDTO } from "../../../application/dto/internal/UserPersistenceDTO";


export class UserRepository extends BaseRepository<UserPersistenceDTO, Prisma.UserDelegate> implements IUserRepository {
    constructor() {
        super(prisma.user);
    }

    async findById(id: string): Promise<User | null> {
        const rawData = await this._findById(id);
        if (!rawData) return null;
        return UserPersistenceMapper.toDomain(rawData);
    }

    async findAll(): Promise<User[]> {
        const rawUsers = await this._findAll();
        return rawUsers.map((user: UserPersistenceDTO) => UserPersistenceMapper.toDomain(user));
    }

    async findByEmail(email: string): Promise<User | null> {
        const rawData = await prisma.user.findUnique({
            where: { email }
        });

        if (!rawData) return null;

        return UserPersistenceMapper.toDomain(rawData);
    }

    async existsByEmail(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        return !!user;
    }

    async save(user: User): Promise<void> {
        const data = UserPersistenceMapper.toPrisma(user);
        const exists = await this.existsById(data.id);

        if (exists) {
            await this._update(data.id, data);
        } else {
            await this._create(data);
        }
    }

    async findManyWithFilters(options: UserQueryOptions): Promise<PaginatedResult<User>> {
        const { page, limit, search, status } = options;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            role: "USER",
        }

        if (status === "ACTIVE") {
            where.isBlocked = false;
        } else if (status === "BLOCKED") {
            where.isBlocked = true;
        }

        if (search && search.trim() !== "") {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { id: { contains: search, mode: "insensitive" } },
            ];
        }

        const [rawUser, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        const users = rawUser.map((user: UserPersistenceDTO) => UserPersistenceMapper.toDomain(user));

        return { data: users, total };
    }
}