import bcrypt from "bcrypt";
import { IPasswordHashService } from "../../../application/interface/services/IPasswordHashService";


export class PasswordHashService implements IPasswordHashService {
    async hash(pin: string): Promise<string> {
        return bcrypt.hash(pin, 10);
    }
}