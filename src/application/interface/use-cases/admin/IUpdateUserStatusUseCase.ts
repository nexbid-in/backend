import { type UpdateUserStatusDTO } from "../../../dto/admin/UpdateUserStatusDTO";

export interface IUpdateUserStatusUseCase {
    execute(input: UpdateUserStatusDTO): Promise<void>;
}