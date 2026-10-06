import { Request, Response, NextFunction } from "express";
import { IGetUsersUseCase } from "../../../../application/interface/use-cases/admin/IGetUsersUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { getUsersSchema } from "../../validators/AdminValidator";

export class AdminUserController {
  constructor(private readonly _getUsersUseCase: IGetUsersUseCase) {}

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = getUsersSchema.parse(req.query);

      const result = await this._getUsersUseCase.execute(validatedData);

      return ApiResponse.success(res, HttpStatus.OK, SuccessMessages.USERS_RETRIEVED, result);
    } catch (error) {
      next(error);
    }
  }
}
