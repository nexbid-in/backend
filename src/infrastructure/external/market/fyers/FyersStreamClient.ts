// @ts-expect-error fyers-api-v3 does not ship with built-in typescript declarations
import fyersPkg from "fyers-api-v3";
import { IBrokerAuthService } from "../../../../application/interface/services/IBrokerAuthService";
import { ILogger } from "../../../../application/interface/services/ILogger";
import { IMarketStreamService } from "../../../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../../../application/interface/services/IMarketSymbolRegistry";
import { MarketHoursService } from "../../../../application/services/trading/MarketHoursService";
import { MarketTick } from "../../../../domain/entities/market/MarketTick";
import { MarketTickCache } from "../MarketTickCache";

interface IFyersDataSocket {
  on(event: string, callback: (data?: unknown) => void): void;
  subscribe(symbols: string[], flag?: boolean | string): void;
  unsubscribe(symbols: string[]): void;
  connect(): void;
  autoreconnect(): void;
  close(): void;
}

type FyersDataSocketFactory = {
  getInstance(
    accessToken: string,
    logPath?: string,
    enableLogging?: boolean
  ): IFyersDataSocket;
};

const FyersDataSocketClass = (
  fyersPkg as { fyersDataSocket: FyersDataSocketFactory }
).fyersDataSocket;

/**
 * Manages the Fyers WebSocket feed connection, symbol subscriptions, and incoming tick normalization.
 */
export class FyersStreamClient implements IMarketStreamService {
  private readonly tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private readonly activeSubscriptions = new Set<string>();
  private readonly subscribedToBroker = new Set<string>();
  private socket: IFyersDataSocket | null = null;
  private currentSocketToken: string | null = null;
  private isSocketConnected = false;
  private isConnecting = false;

  constructor(
    private readonly brokerAuthService: IBrokerAuthService,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    private readonly tickCache: MarketTickCache,
    private readonly logger: ILogger
  ) {}

  async subscribe(symbols: string[]): Promise<void> {
    symbols.forEach((sym) => {
      const clean = this.symbolRegistry.fromFeedSymbol(sym.toUpperCase().trim());
      this.activeSubscriptions.add(clean);
    });

    await this.ensureSocketConnected();

    if (this.socket && this.isSocketConnected) {
      const toSubscribe: string[] = [];
      this.activeSubscriptions.forEach((clean) => {
        if (!this.subscribedToBroker.has(clean)) {
          toSubscribe.push(clean);
        }
      });

      if (toSubscribe.length > 0) {
        const fyersSymbols = toSubscribe.map((s) =>
          this.symbolRegistry.toFeedSymbol(s)
        );
        this.logger.info(
          { fyersSymbols },
          "Subscribing active symbols to Fyers Data Socket"
        );
        this.socket.subscribe(fyersSymbols);
        toSubscribe.forEach((s) => this.subscribedToBroker.add(s));
      }
    }
  }

  unsubscribe(symbols: string[]): Promise<void> {
    const toRemove: string[] = [];

    symbols.forEach((sym) => {
      const clean = this.symbolRegistry.fromFeedSymbol(sym.toUpperCase().trim());
      this.activeSubscriptions.delete(clean);
      if (this.subscribedToBroker.has(clean)) {
        this.subscribedToBroker.delete(clean);
        toRemove.push(this.symbolRegistry.toFeedSymbol(clean));
      }
    });

    if (this.socket && this.isSocketConnected && toRemove.length > 0) {
      this.socket.unsubscribe(toRemove);
    }

    if (this.activeSubscriptions.size === 0 && this.socket) {
      this.logger.info(
        {},
        "No active subscriptions remaining across gateway; closing idle Fyers socket"
      );
      this.resetSocket();
    }

    return Promise.resolve();
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }

  private async ensureSocketConnected(): Promise<void> {
    if (this.activeSubscriptions.size === 0) {
      return;
    }

    let token: string;
    try {
      token = await this.brokerAuthService.getOrRefreshToken();
    } catch (tokenErr) {
      this.logger.warn(
        { tokenErr },
        "Fyers live WebSocket inactive: Access token unavailable"
      );
      return;
    }

    if (this.socket && this.isSocketConnected && this.currentSocketToken === token) {
      return;
    }

    if (this.socket && this.currentSocketToken !== token) {
      this.logger.info(
        {},
        "Fyers access token refreshed; re-establishing WebSocket feed"
      );
      this.resetSocket();
    }

    if (!this.socket) {
      this.initializeSocket(token);
      return;
    }

    if (!this.isSocketConnected) {
      try {
        this.socket.connect();
      } catch (err) {
        this.logger.error({ err }, "Failed to connect Fyers Data Socket");
      }
    }
  }

  private initializeSocket(token: string): void {
    if (this.isConnecting) {
      return;
    }
    this.isConnecting = true;

    try {
      (fyersPkg as { fyersDataSocket: { instance?: unknown } }).fyersDataSocket.instance = null;
      this.currentSocketToken = token;
      this.socket = FyersDataSocketClass.getInstance(token, "", false);

      this.socket.on("connect", () => this.handleConnect());
      this.socket.on("message", (msg: unknown) => this.handleMessage(msg));
      this.socket.on("error", (err: unknown) => {
        this.isConnecting = false;
        this.logger.error({ err }, "Fyers Live WebSocket error");
      });
      this.socket.on("close", () => this.handleClose());

      this.socket.connect();
      this.socket.autoreconnect();
    } catch (err: unknown) {
      this.isConnecting = false;
      this.logger.error({ err }, "Failed to start Fyers Data Socket");
      this.socket = null;
      this.isSocketConnected = false;
    }
  }

  private handleConnect(): void {
    this.isSocketConnected = true;
    this.isConnecting = false;
    this.logger.info({}, "Connected to Fyers Live Exchange WebSocket feed");

    if (this.activeSubscriptions.size > 0) {
      const fyersSymbols = Array.from(this.activeSubscriptions).map((sym) =>
        this.symbolRegistry.toFeedSymbol(sym)
      );
      this.logger.info(
        { fyersSymbols },
        "Subscribing active symbols to Fyers Live feed"
      );
      this.socket?.subscribe(fyersSymbols);
      this.activeSubscriptions.forEach((sym) => this.subscribedToBroker.add(sym));
    }
  }

  private handleMessage(msg: unknown): void {
    const tick = this.parseRawTick(msg);
    if (!tick) {
      return;
    }

    this.tickCache.set(tick.symbol, tick);
    this.tickCallbacks.forEach((cb) => cb(tick));
  }

  private handleClose(): void {
    this.isSocketConnected = false;
    this.isConnecting = false;
    this.subscribedToBroker.clear();

    if (this.activeSubscriptions.size === 0) {
      this.logger.info(
        {},
        "Fyers Live WebSocket closed; 0 active subscriptions, putting socket to sleep"
      );
      this.socket = null;
      return;
    }

    if (!MarketHoursService.isMarketOpen()) {
      this.logger.info(
        {},
        "Fyers Live WebSocket closed outside market trading hours (09:15-15:30 IST)"
      );
    } else {
      this.logger.warn(
        {},
        "Fyers Live WebSocket closed during active market hours; autoreconnect active"
      );
    }
  }

  private resetSocket(): void {
    try {
      this.socket?.close();
    } catch {
      /* ignore */
    }
    this.socket = null;
    this.isSocketConnected = false;
    this.subscribedToBroker.clear();
  }

  private parseRawTick(msg: unknown): MarketTick | null {
    if (typeof msg !== "object" || msg === null) {
      return null;
    }

    const raw = msg as Record<string, unknown>;
    if (typeof raw.symbol !== "string" || typeof raw.ltp !== "number") {
      return null;
    }

    const cleanSymbol = this.symbolRegistry.fromFeedSymbol(raw.symbol);
    const ltp = raw.ltp;
    const open = typeof raw.open_price === "number" ? raw.open_price : ltp;
    const high = typeof raw.high_price === "number" ? raw.high_price : ltp;
    const low = typeof raw.low_price === "number" ? raw.low_price : ltp;
    const close = typeof raw.prev_close_price === "number" ? raw.prev_close_price : ltp;
    const change = typeof raw.ch === "number" ? raw.ch : +(ltp - close).toFixed(2);
    const changePercent =
      typeof raw.chp === "number"
        ? raw.chp
        : close > 0
          ? +(((ltp - close) / close) * 100).toFixed(2)
          : 0;
    const timestamp =
      typeof raw.last_traded_time === "number"
        ? raw.last_traded_time * 1000
        : typeof raw.exch_feed_time === "number"
          ? raw.exch_feed_time * 1000
          : Date.now();

    return {
      symbol: cleanSymbol,
      ltp,
      open,
      high,
      low,
      close,
      change,
      changePercent,
      volume: typeof raw.vol_traded_today === "number" ? raw.vol_traded_today : 0,
      timestamp,
      atp: typeof raw.avg_trade_price === "number" ? raw.avg_trade_price : undefined,
      bidPrice: typeof raw.bid_price === "number" ? raw.bid_price : undefined,
      askPrice: typeof raw.ask_price === "number" ? raw.ask_price : undefined,
      totalBuyQty: typeof raw.tot_buy_qty === "number" ? raw.tot_buy_qty : undefined,
      totalSellQty: typeof raw.tot_sell_qty === "number" ? raw.tot_sell_qty : undefined,
    };
  }
}
