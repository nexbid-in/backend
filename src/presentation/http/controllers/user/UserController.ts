import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "../../../../application/interface/use-cases/user/IGetUserProfileUseCase";
import { IUpdateUserProfileUseCase } from "../../../../application/interface/use-cases/user/IUpdateUserProfileUseCase";
import { IUploadSignatureService } from "../../../../application/interface/services/IUploadSignatureService";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { ApiResponse } from "../../utils/ApiResponse";
import { getUserProfileSchema, updateUserProfileSchema } from "../../validators/UserProfileValidator";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class UserController {
  constructor(
    private readonly _getUserProfile: IGetUserProfileUseCase,
    private readonly _updateUserProfile: IUpdateUserProfileUseCase,
    private readonly _signatureService: IUploadSignatureService
  ) { }

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

  async getUploadSignature(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signatureData = this._signatureService.generateSignature();

      ApiResponse.success(res, HttpStatus.OK, "Signature generated successfully", signatureData);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const validatedData = updateUserProfileSchema.parse(req.body);

      const updatedProfile = await this._updateUserProfile.execute({
        userId,
        ...validatedData,
      });

      ApiResponse.success(res, HttpStatus.OK, SuccessMessages.PROFILE_UPDATED, updatedProfile);
    } catch (error) {
      next(error);
    }
  }
}

