import { ITradeRepository } from "../../../domain/repositories/trading/ITradeRepository";
import { IStockRepository } from "../../../domain/repositories/stock/IStockRepository";
import { IGetTradebookUseCase } from "../../interface/use-cases/trading/IGetTradebookUseCase";
import {
  TradebookQueryDTO,
  GetTradebookResponseDTO,
  TradebookItemDTO,
} from "../../dto/trading/TradebookDTOs";
import { OrderSide, ProductType } from "../../../domain/entities/trading/Order";
import { Money } from "../../../domain/value-objects/Money";

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

    // Normalize segment filter
    const segmentRaw = query.segment ?? "ALL";
    const productType: ProductType | undefined =
      segmentRaw === "ALL"
        ? undefined
        : segmentRaw === "CNC"
        ? ProductType.CNC
        : ProductType.MIS;

    // Normalize side filter
    const sideRaw = query.side ?? "ALL";
    const side: OrderSide | undefined =
      sideRaw === "ALL"
        ? undefined
        : sideRaw === "BUY"
        ? OrderSide.BUY
        : OrderSide.SELL;

    // 1. Fetch stock exchange lookup
    const allStocks = await this.stockRepo.findAll();
    const stockExchangeMap = new Map<string, string>();
    for (const s of allStocks) {
      stockExchangeMap.set(s.symbol, s.exchange);
    }

    // 2. Fetch all matching trades for this user and filter
    const allMatchingTrades = await this.tradeRepo.findByUserId(userId, {
      from: query.from,
      to: query.to,
      symbol: query.symbol,
      productType,
      side,
      orderBy: "desc",
    });

    // 3. Compute macro summary metrics across all matching executions
    let totalBuyTurnover = Money.zero();
    let totalSellTurnover = Money.zero();
    let totalCharges = Money.zero();

    for (const t of allMatchingTrades) {
      totalCharges = totalCharges.add(t.totalCharges);
      if (t.side === OrderSide.BUY) {
        totalBuyTurnover = totalBuyTurnover.add(t.tradeValue);
      } else {
        totalSellTurnover = totalSellTurnover.add(t.tradeValue);
      }
    }

    const totalTrades = allMatchingTrades.length;
    const totalPages = Math.max(1, Math.ceil(totalTrades / limit));

    // 4. Paginate trades for the execution ledger
    const startIndex = (page - 1) * limit;
    const paginatedTrades = allMatchingTrades.slice(startIndex, startIndex + limit);

    const trades: TradebookItemDTO[] = paginatedTrades.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      symbol: t.symbol,
      exchange: stockExchangeMap.get(t.symbol) ?? "NSE",
      productType: t.productType,
      side: t.side,
      quantity: t.quantity,
      price: t.price.toNumber(),
      tradeValue: t.tradeValue.toNumber(),
      charges: {
        brokerage: t.brokerage.toNumber(),
        stt: t.stt.toNumber(),
        exchangeTurnoverCharges: t.exchangeTurnoverCharges.toNumber(),
        sebiCharges: t.sebiCharges.toNumber(),
        stampDuty: t.stampDuty.toNumber(),
        gst: t.gst.toNumber(),
        total: t.totalCharges.toNumber(),
      },
      executedAt: t.executedAt.toISOString(),
    }));

    return {
      trades,
      summary: {
        totalTrades,
        totalBuyTurnover: totalBuyTurnover.toNumber(),
        totalSellTurnover: totalSellTurnover.toNumber(),
        totalCharges: totalCharges.toNumber(),
      },
      pagination: {
        page,
        limit,
        totalCount: totalTrades,
        totalPages,
      },
    };
  }
}
