
export interface IRateLimiter {
    incrementAndCheck(key: string, limit: number, windowInSeconds: number): Promise<boolean>
}