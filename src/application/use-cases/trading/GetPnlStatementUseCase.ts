import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IPositionRepository } from "../../../domain/repositories/trading/IPositionRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IMarketQuoteReader } from "../../interface/services/IMarketDataService";
import { IGetPnlStatementUseCase } from "../../interface/use-cases/trading/IGetPnlStatementUseCase";
import {
  PnlStatementQueryDTO,
  GetPnlStatementResponseDTO,
  PnlSegment,
} from "../../dto/trading/PnlDTOs";
import { ProductType } from "../../../domain/entities/trading/Order";
import { FifoLotMatcher } from "../../../domain/services/trading/FifoLotMatcher";
import { PnlReportAggregator } from "../../../domain/services/trading/PnlReportAggregator";
import { PnlStatementDTOMapper } from "../../mapper/trading/PnlStatementDTOMapper";

/**
 * Orchestrates normalizing statement query filters, loading trades/positions/stocks,
 * matching FIFO trade lots, resolving live quotes for open inventory, aggregating P&L,
 * and projecting the response via PnlStatementDTOMapper.
 */
export class GetPnlStatementUseCase implements IGetPnlStatementUseCase {
  constructor(
    private readonly tradeRepo: ITradeRepository,
    private readonly positionRepo: IPositionRepository,
    private readonly stockRepo: IStockRepository,
    private readonly quoteReader: IMarketQuoteReader
  ) {}

  async execute(
    userId: string,
    query: PnlStatementQueryDTO
  ): Promise<GetPnlStatementResponseDTO> {
    const pnlType = query.pnlType ?? "COMBINED";
    const { segmentLabel, productTypeFilter } = this.normalizeSegment(
      query.segment
    );

    const [allUserTrades, allStocks, activePositions] = await Promise.all([
      this.tradeRepo.findByUserId(userId, {
        to: query.to,
        symbol: query.symbol,
        productType: productTypeFilter,
      }),
      this.stockRepo.findAll(),
      this.positionRepo.findAllPositionsByUserId(userId),
    ]);

    const stockExchangeMap = new Map<string, string>();
    for (const stock of allStocks) {
      stockExchangeMap.set(stock.symbol, stock.exchange);
    }

    const matching = FifoLotMatcher.matchTrades({
      trades: allUserTrades,
      positions: activePositions,
      productTypeFilter,
      symbolFilter: query.symbol,
      from: query.from,
      to: query.to,
    });

    const ltpBySymbol = await this.fetchLiveLtpMap(matching.openSymbols);

    const report = PnlReportAggregator.aggregate({
      matching,
      stockExchangeMap,
      ltpBySymbol,
    });

    return PnlStatementDTOMapper.toDTO({
      report,
      pnlType,
      fromDate: query.from,
      toDate: query.to,
      segment: segmentLabel,
    });
  }

  private normalizeSegment(segmentRaw?: PnlSegment): {
    segmentLabel: "ALL" | "CNC" | "MIS";
    productTypeFilter?: ProductType;
  } {
    if (!segmentRaw || segmentRaw === "COMBINED" || segmentRaw === "ALL") {
      return { segmentLabel: "ALL", productTypeFilter: undefined };
    }
    if (segmentRaw === "DELIVERY" || segmentRaw === "CNC") {
      return { segmentLabel: "CNC", productTypeFilter: ProductType.CNC };
    }
    return { segmentLabel: "MIS", productTypeFilter: ProductType.MIS };
  }

  private async fetchLiveLtpMap(
    symbols: string[]
  ): Promise<Map<string, number>> {
    const ltpBySymbol = new Map<string, number>();
    if (symbols.length === 0) {
      return ltpBySymbol;
    }

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        const quote = await this.quoteReader.getQuote(symbol);
        return { symbol, ltp: quote?.ltp };
      })
    );

    for (const { symbol, ltp } of quotes) {
      if (ltp && ltp > 0) {
        ltpBySymbol.set(symbol, ltp);
      }
    }

    return ltpBySymbol;
  }
}
