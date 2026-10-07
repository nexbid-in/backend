import { Request, Response, NextFunction } from "express";
import { IGetUsersUseCase } from "../../../../application/interface/use-cases/admin/IGetUsersUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { getUsersSchema, updateUserStatusSchema } from "../../validators/AdminValidator";
import { IUpdateUserStatusUseCase } from "../../../../application/interface/use-cases/admin/IUpdateUserStatusUseCase";

export class AdminUserController {
    constructor(
        private readonly _getUsers: IGetUsersUseCase,
        private readonly _updateUserStatus: IUpdateUserStatusUseCase,
    ) { }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = getUsersSchema.parse(req.query);

            const result = await this._getUsers.execute(validatedData);

            return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.USERS_RETRIEVED, result);
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = updateUserStatusSchema.parse(req.params);

            await this._updateUserStatus.execute(validatedData);

            return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.USER_STATUS_UPDATED);
        } catch (error) {
            next(error);
        }
    }
}
