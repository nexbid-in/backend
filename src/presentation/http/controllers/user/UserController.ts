import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "../../../../application/interface/use-cases/user/IGetUserProfileUseCase";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { getUserProfileSchema } from "../../validators/UserProfileValidator";

export class UserController {
  constructor(private readonly _getUserProfile: IGetUserProfileUseCase) { }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = getUserProfileSchema.parse({
        userId: req.user?.userId,
      });

      const profile = await this._getUserProfile.execute(validatedData);

      ApiResponse.success(res, HttpStatus.OK, SuccessMessages.PROFILE_RETRIEVED, profile);
    } catch (error) {
      next(error);
    }
  }
}
