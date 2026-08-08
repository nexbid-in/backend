
export interface IBaseRepository<TEntity> {
    findById(id: string): Promise<TEntity | null>;
    findAll(): Promise<TEntity[]>;
    existsById(id: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
}
