import { UserRegisterDTO } from "../../../dto/request/auth/register.dto";


export interface IUserRegistrationUseCase {
    execute(input: UserRegisterDTO): Promise<void>;
}

