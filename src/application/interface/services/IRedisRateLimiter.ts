
export interface IRedisRateLimiter {
    incrementAndCheck(key: string, limit: number, windowInSeconds: number): Promise<boolean>
}