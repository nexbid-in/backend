import { RegisterUserDTO } from "../../../dto/request/auth/register.dto";


export interface IRegisterUserUseCase {
    execute(input: RegisterUserDTO): Promise<void>;
}

