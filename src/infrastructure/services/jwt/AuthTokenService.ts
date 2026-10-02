import jwt from "jsonwebtoken";
import { IAuthTokenService, IAuthTokenServiceInput } from "../../../application/interface/services/ITokenService";
import { env } from "../../config/env";


export class AuthTokenService implements IAuthTokenService {
    generate(payload: IAuthTokenServiceInput): string {
        return jwt.sign(
            payload,
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },

        );
    }

    verify(token: string): IAuthTokenServiceInput {
        return jwt.verify(token, env.JWT_SECRET) as IAuthTokenServiceInput;
    }
}