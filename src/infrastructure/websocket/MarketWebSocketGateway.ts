import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import {
  IMarketQuoteReader,
  IMarketStreamService,
} from "../../application/interface/services/IMarketDataService";
import { IMarketSymbolRegistry } from "../../application/interface/services/IMarketSymbolRegistry";
import { MarketTick } from "../../domain/entities/market/MarketTick";
import {
  buildSymbolAliasLookup,
  SymbolAliasLookup,
} from "../config/marketSymbolAliases";
import { logger } from "../logging/logger";
import { serializeMarketTickPayload } from "./MarketTickSerializer";

interface ClientWsMessage {
  action: "subscribe" | "unsubscribe";
  symbol: string;
}

/**
 * WebSocket gateway managing client subscriptions on /ws/market-feed
 * and fanning out normalized broker market ticks.
 */
export class MarketWebSocketGateway {
  private readonly wss: WebSocketServer;
  private readonly subscriptions = new Map<WebSocket, Set<string>>();
  private readonly socketSubscriptionTimestamps = new Map<
    WebSocket,
    Map<string, number>
  >();
  private readonly symbolSubscribers = new Map<string, Set<WebSocket>>();
  private readonly brokerUnsubscribeTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    server: HttpServer,
    private readonly marketStream: IMarketStreamService,
    private readonly quoteReader: IMarketQuoteReader,
    private readonly symbolRegistry: IMarketSymbolRegistry,
    private readonly symbolAliases: SymbolAliasLookup = buildSymbolAliasLookup()
  ) {
    this.wss = new WebSocketServer({ server, path: "/ws/market-feed" });
    this.initialize();
  }

  private initialize(): void {
    this.wss.on("connection", (ws: WebSocket) => {
      this.subscriptions.set(ws, new Set());
      this.socketSubscriptionTimestamps.set(ws, new Map());
      logger.info("Market WS client connected to /ws/market-feed");

      ws.on("message", (raw: RawData) => this.handleClientMessage(ws, raw));
      ws.on("close", () => this.handleClientDisconnect(ws));
    });

    this.marketStream.onTick((tick) => this.broadcastTick(tick));
    logger.info("Market WebSocket Gateway initialized on /ws/market-feed");
  }

  private handleClientMessage(ws: WebSocket, raw: RawData): void {
    try {
      const text = Buffer.isBuffer(raw)
        ? raw.toString("utf-8")
        : Array.isArray(raw)
          ? Buffer.concat(raw).toString("utf-8")
          : Buffer.from(raw).toString("utf-8");
      const parsed: unknown = JSON.parse(text);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("action" in parsed) ||
        !("symbol" in parsed)
      ) {
        return;
      }

      const message = parsed as ClientWsMessage;
      const rawSym = String(message.symbol).toUpperCase().trim();
      const cleanSym = this.symbolRegistry.fromFeedSymbol(rawSym);
      const fyersSym = this.symbolRegistry.toFeedSymbol(rawSym);

      if (message.action === "subscribe") {
        this.handleSubscribe(ws, rawSym, cleanSym, fyersSym);
      } else if (message.action === "unsubscribe") {
        this.handleUnsubscribe(ws, rawSym, cleanSym, fyersSym);
      }
    } catch (err: unknown) {
      logger.warn({ err }, "Malformed WS message received");
    }
  }

  private handleSubscribe(
    ws: WebSocket,
    rawSym: string,
    cleanSym: string,
    fyersSym: string
  ): void {
    const userSubs = this.subscriptions.get(ws);
    const timestamps = this.socketSubscriptionTimestamps.get(ws);

    timestamps?.set(cleanSym, Date.now());
    userSubs?.add(rawSym);
    userSubs?.add(cleanSym);
    userSubs?.add(fyersSym);
    userSubs?.add(cleanSym.replace(/\s+/g, ""));
    userSubs?.add(rawSym.replace(/\s+/g, ""));

    const pendingTimer = this.brokerUnsubscribeTimers.get(cleanSym);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.brokerUnsubscribeTimers.delete(cleanSym);
    }

    let subscribers = this.symbolSubscribers.get(cleanSym);
    if (!subscribers) {
      subscribers = new Set();
      this.symbolSubscribers.set(cleanSym, subscribers);
    }
    const isFirstSubscriber = subscribers.size === 0;
    subscribers.add(ws);

    logger.info(
      { rawSym, cleanSym, totalSubscribers: subscribers.size },
      "Client subscribed to market feed"
    );

    if (isFirstSubscriber) {
      void this.marketStream.subscribe([cleanSym]);
    }

    void this.sendInitialQuoteSnapshot(ws, cleanSym);
  }

  private async sendInitialQuoteSnapshot(
    ws: WebSocket,
    cleanSym: string
  ): Promise<void> {
    try {
      const quote = await this.quoteReader.getQuote(cleanSym);
      if (quote && ws.readyState === WebSocket.OPEN) {
        ws.send(serializeMarketTickPayload(quote));
      }
    } catch {
      /* ignore snapshot errors */
    }
  }

  private handleUnsubscribe(
    ws: WebSocket,
    rawSym: string,
    cleanSym: string,
    fyersSym: string
  ): void {
    const timestamps = this.socketSubscriptionTimestamps.get(ws);
    const lastSubscribed = timestamps?.get(cleanSym) ?? 0;
    const elapsedMs = Date.now() - lastSubscribed;

    if (elapsedMs < 1500) {
      logger.warn(
        { rawSym, cleanSym, elapsedMs },
        "Suppressed rapid ghost unsubscribe: subscription was initiated just milliseconds ago"
      );
      return;
    }

    const userSubs = this.subscriptions.get(ws);
    userSubs?.delete(rawSym);
    userSubs?.delete(cleanSym);
    userSubs?.delete(fyersSym);
    userSubs?.delete(cleanSym.replace(/\s+/g, ""));
    userSubs?.delete(rawSym.replace(/\s+/g, ""));
    timestamps?.delete(cleanSym);

    const subscribers = this.symbolSubscribers.get(cleanSym);
    if (!subscribers) {
      return;
    }

    subscribers.delete(ws);
    logger.info(
      { rawSym, cleanSym, remainingSubscribers: subscribers.size },
      "Client unsubscribed from market feed"
    );

    if (subscribers.size === 0) {
      this.scheduleBrokerUnsubscribe(
        cleanSym,
        "No remaining subscribers after debounce; unsubscribing broker feed"
      );
    }
  }

  private handleClientDisconnect(ws: WebSocket): void {
    for (const [cleanSym, subscribers] of this.symbolSubscribers.entries()) {
      if (subscribers.has(ws)) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.scheduleBrokerUnsubscribe(
            cleanSym,
            "No remaining subscribers after socket disconnect; unsubscribing broker feed"
          );
        }
      }
    }

    this.subscriptions.delete(ws);
    this.socketSubscriptionTimestamps.delete(ws);
    logger.info("Market WS client disconnected");
  }

  private scheduleBrokerUnsubscribe(
    cleanSym: string,
    logMessage: string
  ): void {
    const timer = setTimeout(() => {
      const current = this.symbolSubscribers.get(cleanSym);
      if (!current || current.size === 0) {
        logger.info({ cleanSym }, logMessage);
        void this.marketStream.unsubscribe([cleanSym]);
        this.symbolSubscribers.delete(cleanSym);
      }
      this.brokerUnsubscribeTimers.delete(cleanSym);
    }, 5000);

    this.brokerUnsubscribeTimers.set(cleanSym, timer);
  }

  private broadcastTick(tick: MarketTick): void {
    const payload = serializeMarketTickPayload(tick);
    const fyersSym = this.symbolRegistry.toFeedSymbol(tick.symbol);
    const spaceless = tick.symbol.replace(/\s+/g, "");
    const aliases = this.symbolAliases.get(tick.symbol);

    for (const [ws, symbols] of this.subscriptions.entries()) {
      if (ws.readyState !== WebSocket.OPEN) {
        continue;
      }

      if (this.isSubscribed(symbols, tick.symbol, fyersSym, spaceless, aliases)) {
        ws.send(payload);
      }
    }
  }

  private isSubscribed(
    subscribedSymbols: Set<string>,
    symbol: string,
    fyersSym: string,
    spaceless: string,
    aliases?: ReadonlySet<string>
  ): boolean {
    if (
      subscribedSymbols.has(symbol) ||
      subscribedSymbols.has(fyersSym) ||
      subscribedSymbols.has(spaceless)
    ) {
      return true;
    }

    if (!aliases) {
      return false;
    }

    for (const alias of aliases) {
      if (subscribedSymbols.has(alias)) {
        return true;
      }
    }

    return false;
  }
}
