import { Candle } from "../../../../domain/entities/market/Candle";
import { GetHistoricalCandlesRequestDTO } from "../../../dto/market/GetHistoricalCandlesDTO";

export interface IGetHistoricalCandlesUseCase {
    execute(data: GetHistoricalCandlesRequestDTO): Promise<Candle[]>;
}