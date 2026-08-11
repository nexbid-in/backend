import bcrypt from "bcrypt";
import { IPasswordHashService } from "../../../application/interface/services/IPasswordHashService";


export class PasswordHashService implements IPasswordHashService {
    async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    async compare(plain: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(plain, hash);
    }
}