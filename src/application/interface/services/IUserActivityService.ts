export interface IUserActivityService {
  recordActivity(userId: string): Promise<void>;
}
