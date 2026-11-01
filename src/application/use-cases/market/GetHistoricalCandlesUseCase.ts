import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";
import { IGetHistoricalCandlesUseCase } from "../../interface/use-cases/market/IGetHistoricalCandlesUseCase";
import { GetHistoricalCandlesRequestDTO } from "../../dto/market/GetHistoricalCandlesDTO";

export class GetHistoricalCandlesUseCase implements IGetHistoricalCandlesUseCase {
    constructor(private readonly marketService: IMarketDataService) { }

    async execute(data: GetHistoricalCandlesRequestDTO): Promise<Candle[]> {
        if (!data.symbol) {
            throw new AppError(ErrorCodes.VALIDATION_FAILED, "Stock symbol is required");
        }

        const toTimestamp = data.to || Date.now();
        const fromTimestamp = data.from || toTimestamp - 30 * 24 * 60 * 60 * 1000;

        return await this.marketService.getHistoricalCandles(
            data.symbol.toUpperCase().trim(),
            data.resolution,
            fromTimestamp,
            toTimestamp
        );
    }
}