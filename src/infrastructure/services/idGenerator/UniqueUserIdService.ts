import { IUserRepository } from "../../../domain/repositories/user/IUserRepository";
import { IUniqueUserIdService, IUserIdGenerator } from "../../../application/interface/services/IUserIdGenerator";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";


export class UniqueUserIdService implements IUniqueUserIdService {
    private MAX_RETRIES = 5;

    constructor(
        private _userRepo: IUserRepository,
        private _generator: IUserIdGenerator
    ) {}

    async generate(fullName: string): Promise<string> {
        for (let i = 0; i < this.MAX_RETRIES; i++) {
            const id = this._generator.generate(fullName);

            const exists = await this._userRepo.existsById(id);
            if (!exists) {
                return id;
            }
        }

        throw new AppError(ErrorCodes.USER_ID_GENERATION_FAILED);
    }
}