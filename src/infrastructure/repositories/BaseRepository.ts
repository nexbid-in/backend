
export abstract class BaseRepository<TDelegate> {
    constructor(protected readonly model: TDelegate) {}

    protected async _findById(id: string): Promise<any | null> {
        return await (this.model as any).findUnique({
            where: { id }
        });
    }

    protected async _findAll(): Promise<any[]> {
        return await (this.model as any).findMany();
    }

    public async existsById(id: string): Promise<boolean> {
        const record = await (this.model as any).findUnique({
            where: { id },
            select: { id: true },
        });

        return !!record;
    }

    protected async _create<TData>(data: TData): Promise<any> {
        return await (this.model as any).create({ data });
    }

    protected async _update<TData>(id: string, data: TData): Promise<any> {
        return await (this.model as any).update({
            where: { id },
            data
        });
    }

    public async delete(id: string): Promise<boolean> {
        try {
            await (this.model as any).delete({
                where: { id }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}
