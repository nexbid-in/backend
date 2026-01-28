

export interface PrismaCreateDelegate<TData, TResult> {
  create(args: { data: TData }): Promise<TResult>;
}
