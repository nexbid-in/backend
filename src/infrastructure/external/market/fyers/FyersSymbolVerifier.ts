import axios from "axios";
import { IBrokerAuthService } from "../../../../application/interface/services/IBrokerAuthService";
import {
  IMarketSymbolVerifier,
  SymbolVerificationResult,
} from "../../../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../../../application/interface/services/IMarketSymbolRegistry";
import { env } from "../../../config/env";
import { MarketTickCache } from "../MarketTickCache";

interface FyersQuotesResponse {
  s: string;
  d?: Array<{
    n: string;
    s: string;
    errmsg?: string;
    v?: {
      s?: string;
      errmsg?: string;
      lp?: number;
      prev_close_price?: number;
      description?: string;
      exchange?: string;
      short_name?: string;
    };
  }>;
}

/**
 * Verifies instrument tickers against live cached ticks or Fyers REST quotes API.
 */
export class FyersSymbolVerifier implements IMarketSymbolVerifier {
  constructor(
    private readonly brokerAuthService: IBrokerAuthService,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    private readonly tickCache: MarketTickCache
  ) {}

  async verifySymbol(symbol: string): Promise<SymbolVerificationResult> {
    const clean = this.symbolRegistry.fromFeedSymbol(symbol.toUpperCase().trim());
    const liveTick = this.tickCache.get(clean);
    if (liveTick && liveTick.ltp > 0) {
      return {
        valid: true,
        ltp: liveTick.ltp,
        description: clean,
      };
    }

    const fyersSymbol = this.symbolRegistry.toFeedSymbol(symbol);

    try {
      const token = await this.brokerAuthService.getOrRefreshToken();
      const response = await axios.get<FyersQuotesResponse>(
        "https://api-t1.fyers.in/data/quotes",
        {
          params: { symbols: fyersSymbol },
          headers: { Authorization: `${env.FYERS_APP_ID ?? ""}:${token}` },
          timeout: 4000,
        }
      );

      if (
        response.data?.s === "ok" &&
        response.data.d &&
        response.data.d.length > 0
      ) {
        const item = response.data.d[0];
        const v = item.v;
        if (
          item.s === "ok" &&
          v &&
          v.s !== "error" &&
          !v.errmsg &&
          (typeof v.lp === "number" || typeof v.prev_close_price === "number")
        ) {
          const ltp = typeof v.lp === "number" ? v.lp : v.prev_close_price;
          return {
            valid: true,
            ltp,
            description: v.description ?? v.short_name,
            exchange: v.exchange,
          };
        }
      }

      return { valid: false };
    } catch {
      return { valid: false };
    }
  }
}
