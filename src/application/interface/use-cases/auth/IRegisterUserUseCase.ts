import { RegisterUserDTO } from "../../../dto/auth/RegisterDTO";


export interface IRegisterUserUseCase {
    execute(input: RegisterUserDTO): Promise<void>;
}

