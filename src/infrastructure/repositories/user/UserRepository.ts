import { prisma } from "../../database/prisma";
import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { User } from "../../../domain/entities/User";
import { UserPersistenceMapper } from "../../../application/mapper/user/UserPersistenceMapper";
import { BaseRepository } from "../BaseRepository";


export class UserRepository extends BaseRepository implements IUserRepository {
    async existsByEmail(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        return !!user;
    }

    async existsByMobile(mobile: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { mobile },
            select: { id: true }
        });

        return !!user;
    }

    async existsById(id: string): Promise<boolean> {
        return this._existsById(prisma.user, id);
    }
    
    async save(user: User): Promise<void> {
        const data = UserPersistenceMapper.toPrisma(user);
        this._create(prisma.user, data);
    }
}