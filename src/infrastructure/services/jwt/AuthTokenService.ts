import jwt from "jsonwebtoken";
import { IAuthTokenService, IAuthTokenServiceInput } from "../../../application/interface/services/ITokenService";


export class AuthTokenService implements IAuthTokenService {
    generate(payload: IAuthTokenServiceInput): string {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET!,
            { expiresIn: "1d"},
        );
    }
}