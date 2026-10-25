export type ReconcilePendingOrdersResult = {
  totalProcessed: number;
  markedSuccess: number;
  markedFailed: number;
};

export interface IReconcilePendingOrdersUseCase {
  execute(olderThanMinutes?: number): Promise<ReconcilePendingOrdersResult>;
}
