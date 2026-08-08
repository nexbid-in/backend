import { Prisma } from "../../database/generated/prisma/client";
import { prisma } from "../../database/prisma";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { User } from "../../../domain/entities/User";
import { UserPersistenceMapper } from "../../../application/mapper/user/UserPersistenceMapper";
import { BaseRepository } from "../BaseRepository";
import { UserPersistenceDTO } from "../../../application/dto/internal/user-persistence.dto";


export class UserRepository extends BaseRepository<Prisma.UserDelegate> implements IUserRepository {
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
}