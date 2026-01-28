import bcrypt from "bcrypt";
import { IOtpService } from "../../../application/interface/services/IOtpService";

export class OtpService implements IOtpService {
    generate(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async hash(otp: string): Promise<string> {
        return bcrypt.hash(otp, 10)
    }

    async compare(otp: string, hash: string): Promise<boolean> {
        return bcrypt.compare(otp, hash);
    }
}