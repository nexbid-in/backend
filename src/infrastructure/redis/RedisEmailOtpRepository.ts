import { IEmailOtpRepository } from "../../domain/repositories/user/IEmailOtpRepository";
import redis from "../config/redis";


export class RedisEmailOtpRepository implements IEmailOtpRepository {
    private TTL = 300;

    private key(email: string): string {
        return `email_otp: ${email}`;
    }

    async save(email: string, otpHash: string): Promise<void> {
        await redis.set(
            this.key(email),
            JSON.stringify({ otpHash, attempts: 0 }),
            "EX",
            this.TTL
        );
    }

    async exists(email: string): Promise<boolean> {
        return (await redis.exists(this.key(email))) === 1;
    }

    async get(email: string): Promise<{ otpHash: string; attempts: number; } | null> {
        const data = await redis.get(this.key(email));
        return data ? JSON.parse(data) : null;
    }

    async incrementAttempts(email: string): Promise<void> {
        const data = await this.get(email);
        if(!data) return;

        data.attempts += 1;
        await redis.set(
            this.key(email),
            JSON.stringify(data),
            "KEEPTTL"
        );
    }

    async delete(email: string): Promise<void> {
        await redis.del(this.key(email));
    }
}