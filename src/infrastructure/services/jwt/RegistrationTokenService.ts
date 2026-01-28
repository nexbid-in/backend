import jwt from "jsonwebtoken";
import { IRegistrationTokenService, IRegistrationVerifyTokenOutput } from "../../../application/interface/services/ITokenService";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";


export class RegistrationTokenService implements IRegistrationTokenService {
    generate(email: string): string {
        return jwt.sign(
            { email, scope: "registration" },
            process.env.JWT_SECRET!,
            { expiresIn: "10m"}
        );
    }

    verify(token: string): IRegistrationVerifyTokenOutput {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as any;

        if (payload.scope !== "registration") {
            throw new AppError(ErrorCodes.INVALID_REGISTRATION_TOKEN);
        }

        return { email : payload.email };
    }
}