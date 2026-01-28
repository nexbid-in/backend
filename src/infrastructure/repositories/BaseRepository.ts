import { PrismaCreateDelegate } from "../database/types/PrismaCreateDelegate";
import { PrismaFindByIdDelegate } from "../database/types/PrismaFindByIdDelegate";


export abstract class BaseRepository {
    protected async _existsById(model: PrismaFindByIdDelegate, id: string): Promise<boolean> {
        const record = await model.findUnique({
            where: { id },
            select: { id: true },
        });

        return !!record;
    }

    protected async _create<TData, TResult>(model: PrismaCreateDelegate<TData, TResult>, data: TData): Promise<TResult> {
        return await model.create({ data });
    }
}
