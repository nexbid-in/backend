import bcrypt from "bcrypt";
import { IPinHashService } from "../../../application/interface/services/IPinService";


export class PinHashService implements IPinHashService {
    async hash(pin: string): Promise<string> {
        return bcrypt.hash(pin, 10);
    }
}