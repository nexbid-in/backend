import { Request, Response, NextFunction } from "express";
import { IGetDashboardOverviewUseCase } from "../../../../application/interface/use-cases/dashboard/IGetDashboardOverviewUseCase";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";
import { SuccessMessages } from "../../constants/SuccessMessages";
import { AppError } from "../../../../shared/errors/AppError";
import { ErrorCodes } from "../../../../shared/errors/ErrorCodes";

export class DashboardController {
  constructor(
    private readonly getDashboardOverviewUseCase: IGetDashboardOverviewUseCase
  ) {}

  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(ErrorCodes.UNAUTHORIZED);
      }

      const result = await this.getDashboardOverviewUseCase.execute(userId);

      ApiResponse.success(
        res,
        HttpStatus.OK,
        SuccessMessages.DASHBOARD_OVERVIEW_RETRIEVED,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}
