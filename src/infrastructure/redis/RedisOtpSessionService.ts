import { IOtpSessionService, UnverifiedUser } from "../../application/interface/services/IOtpSessionService";
import redis from "../config/redis";


export class RedisOtpSessionService implements IOtpSessionService {
    private TTL = 300;

    private key(email: string): string {
        return `email_otp: ${email}`;
    }

    async save(email: string, otpHash: string, data: UnverifiedUser): Promise<void> {
        await redis.set(
            this.key(email),
            JSON.stringify({ otpHash, attempts: 0, data }),
            "EX",
            this.TTL
        );
    }

    async get(email: string): Promise<{ otpHash: string; attempts: number; data: UnverifiedUser } | null> {
        const rawData = await redis.get(this.key(email));
        return rawData ? JSON.parse(rawData) : null;
    }

    async incrementAttempts(email: string): Promise<void> {
        const data = await this.get(email);
        if (!data) return;

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