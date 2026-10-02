import { RegisterUserDTO } from "../../../dto/user/auth/RegisterDTO";


export interface IRegisterUserUseCase {
    execute(input: RegisterUserDTO): Promise<void>;
}

