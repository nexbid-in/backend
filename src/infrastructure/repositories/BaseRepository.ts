export interface IRepositoryMethods<TEntity> {
    findUnique(args: { where: { id: string }; select: { id: true } }): Promise<{ id: string } | null>;
    findUnique(args: { where: { id: string } }): Promise<TEntity | null>;
    findMany(): Promise<TEntity[]>;
    create(args: { data: unknown }): Promise<TEntity>;
    update(args: { where: { id: string }; data: unknown }): Promise<TEntity>;
    delete(args: { where: { id: string } }): Promise<TEntity>;
}

export abstract class BaseRepository<TEntity, TDelegate> {
    constructor(protected readonly model: TDelegate) {}

    private get delegate(): IRepositoryMethods<TEntity> {
        return this.model as unknown as IRepositoryMethods<TEntity>;
    }

    protected async _findById(id: string): Promise<TEntity | null> {
        return await this.delegate.findUnique({
            where: { id }
        });
    }

    protected async _findAll(): Promise<TEntity[]> {
        return await this.delegate.findMany();
    }

    public async existsById(id: string): Promise<boolean> {
        const record = await this.delegate.findUnique({
            where: { id },
            select: { id: true },
        });

        return !!record;
    }

    protected async _create<TData>(data: TData): Promise<TEntity> {
        return await this.delegate.create({ data });
    }

    protected async _update<TData>(id: string, data: TData): Promise<TEntity> {
        return await this.delegate.update({
            where: { id },
            data
        });
    }

    public async delete(id: string): Promise<boolean> {
        try {
            await this.delegate.delete({
                where: { id }
            });
            return true;
        } catch {
            return false;
        }
    }
}

