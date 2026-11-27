import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { TradebookCalculator } from "../../../domain/services/trading/TradebookCalculator";
import {
  GetTradebookResponseDTO,
  TradebookQueryDTO,
  TradebookSegment,
  TradebookSide,
} from "../../dto/trading/TradebookDTOs";
import { IGetTradebookUseCase } from "../../interface/use-cases/trading/IGetTradebookUseCase";
import { TradebookDTOMapper } from "../../mapper/trading/TradebookDTOMapper";

/**
 * Orchestrates normalizing tradebook query filters, fetching trades and stock exchanges,
 * delegating macro summary calculation, paginating, and mapping the DTO response.
 */
export class GetTradebookUseCase implements IGetTradebookUseCase {
  constructor(
    private readonly tradeRepo: ITradeRepository,
    private readonly stockRepo: IStockRepository
  ) {}

  async execute(
    userId: string,
    query: TradebookQueryDTO
  ): Promise<GetTradebookResponseDTO> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const productType = this.resolveProductType(query.segment);
    const side = this.resolveOrderSide(query.side);

    const [allStocks, allMatchingTrades] = await Promise.all([
      this.stockRepo.findAll(),
      this.tradeRepo.findByUserId(userId, {
        from: query.from,
        to: query.to,
        symbol: query.symbol,
        productType,
        side,
        orderBy: "desc",
      }),
    ]);

    const stockExchangeMap = new Map<string, string>();
    for (const stock of allStocks) {
      stockExchangeMap.set(stock.symbol, stock.exchange);
    }

    const summary = TradebookCalculator.summarize(allMatchingTrades);
    const totalPages = Math.max(1, Math.ceil(summary.totalTrades / limit));
    const startIndex = (page - 1) * limit;
    const paginatedTrades = allMatchingTrades.slice(
      startIndex,
      startIndex + limit
    );

    return TradebookDTOMapper.toDTO({
      paginatedTrades,
      stockExchangeMap,
      summary,
      page,
      limit,
      totalPages,
    });
  }

  private resolveProductType(
    segment?: TradebookSegment
  ): ProductType | undefined {
    if (!segment || segment === "ALL") {
      return undefined;
    }
    return segment === "CNC" ? ProductType.CNC : ProductType.MIS;
  }

  private resolveOrderSide(side?: TradebookSide): OrderSide | undefined {
    if (!side || side === "ALL") {
      return undefined;
    }
    return side === "BUY" ? OrderSide.BUY : OrderSide.SELL;
  }
}
