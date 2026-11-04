import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { logger } from "../logging/logger";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { MarketSymbolMapper } from "../external/market/MarketSymbolMapper";

interface ClientWsMessage {
    action: "subscribe" | "unsubscribe";
    symbol: string;
}

export class MarketWebSocketGateway {
    private wss: WebSocketServer;
    private subscriptions = new Map<WebSocket, Set<string>>();
    private socketSubscriptionTimestamps = new Map<WebSocket, Map<string, number>>();
    private symbolRefCounts = new Map<string, number>();
    private brokerUnsubscribeTimers = new Map<string, NodeJS.Timeout>();

    constructor(server: HttpServer, private readonly marketService: IMarketDataService) {
        this.wss = new WebSocketServer({ server, path: "/ws/market-feed" });
        this.initialize();
    }

    private initialize() {
        this.wss.on("connection", (ws: WebSocket) => {
            this.subscriptions.set(ws, new Set());
            this.socketSubscriptionTimestamps.set(ws, new Map());
            logger.info("Market WS client connected to /ws/market-feed");

            ws.on("message", (raw: RawData) => {
                try {
                    const text = Buffer.isBuffer(raw)
                        ? raw.toString("utf-8")
                        : Array.isArray(raw)
                        ? Buffer.concat(raw).toString("utf-8")
                        : Buffer.from(raw).toString("utf-8");
                    const parsed: unknown = JSON.parse(text);

                    if (
                        typeof parsed === "object" &&
                        parsed !== null &&
                        "action" in parsed &&
                        "symbol" in parsed
                    ) {
                        const message = parsed as ClientWsMessage;
                        const userSubs = this.subscriptions.get(ws);
                        const timestamps = this.socketSubscriptionTimestamps.get(ws);
                        const rawSym = String(message.symbol).toUpperCase().trim();
                        const cleanSym = MarketSymbolMapper.fromFyersSymbol(rawSym);
                        const fyersSym = MarketSymbolMapper.toFyersSymbol(rawSym);

                        if (message.action === "subscribe") {
                            // Record timestamp to protect against rapid unmount/remount ghost unsubscribes
                            timestamps?.set(cleanSym, Date.now());

                            userSubs?.add(rawSym);
                            userSubs?.add(cleanSym);
                            userSubs?.add(fyersSym);
                            userSubs?.add(cleanSym.replace(/\s+/g, ""));
                            userSubs?.add(rawSym.replace(/\s+/g, ""));

                            // Cancel any pending broker unsubscribe for this symbol
                            const pendingTimer = this.brokerUnsubscribeTimers.get(cleanSym);
                            if (pendingTimer) {
                                clearTimeout(pendingTimer);
                                this.brokerUnsubscribeTimers.delete(cleanSym);
                            }

                            const prevCount = this.symbolRefCounts.get(cleanSym) ?? 0;
                            this.symbolRefCounts.set(cleanSym, prevCount + 1);

                            logger.info({ rawSym, cleanSym, totalSubscribers: prevCount + 1 }, "Client subscribed to market feed");
                            void this.marketService.subscribe([cleanSym]);

                            // Emit instant quote if cached
                            void (async () => {
                                try {
                                    const quote = await this.marketService.getQuote(cleanSym);
                                    if (quote && ws.readyState === WebSocket.OPEN) {
                                        ws.send(
                                            JSON.stringify({
                                                type: "TICK",
                                                symbol: quote.symbol,
                                                data: {
                                                    ltp: quote.ltp,
                                                    price: quote.ltp,
                                                    open: quote.open,
                                                    high: quote.high,
                                                    low: quote.low,
                                                    close: quote.close,
                                                    volume: quote.volume,
                                                    timestamp: quote.timestamp,
                                                },
                                                ltp: quote.ltp,
                                                price: quote.ltp,
                                                change: quote.change,
                                                changePercent: quote.changePercent,
                                            })
                                        );
                                    }
                                } catch {
                                    // non-fatal
                                }
                            })();
                        } else if (message.action === "unsubscribe") {
                            const lastSubscribed = timestamps?.get(cleanSym) ?? 0;
                            const elapsedMs = Date.now() - lastSubscribed;

                            // Suppress rapid ghost unsubscribes (e.g. React 18 StrictMode or route transition race within 1500ms)
                            if (elapsedMs < 1500) {
                                logger.warn(
                                    { rawSym, cleanSym, elapsedMs },
                                    "Suppressed rapid ghost unsubscribe: subscription was initiated just milliseconds ago"
                                );
                                return;
                            }

                            userSubs?.delete(rawSym);
                            userSubs?.delete(cleanSym);
                            userSubs?.delete(fyersSym);
                            userSubs?.delete(cleanSym.replace(/\s+/g, ""));
                            userSubs?.delete(rawSym.replace(/\s+/g, ""));
                            timestamps?.delete(cleanSym);

                            const prevCount = this.symbolRefCounts.get(cleanSym) ?? 1;
                            const nextCount = Math.max(0, prevCount - 1);
                            this.symbolRefCounts.set(cleanSym, nextCount);

                            logger.info({ rawSym, cleanSym, remainingSubscribers: nextCount }, "Client unsubscribed from market feed");

                            // Only unsubscribe from upstream broker if NO clients on server need it,
                            // debounced by 5 seconds to survive rapid tab switching
                            if (nextCount === 0) {
                                const timer = setTimeout(() => {
                                    const currentCount = this.symbolRefCounts.get(cleanSym) ?? 0;
                                    if (currentCount <= 0) {
                                        logger.info({ cleanSym }, "No remaining subscribers after debounce; unsubscribing broker feed");
                                        void this.marketService.unsubscribe([cleanSym]);
                                    }
                                    this.brokerUnsubscribeTimers.delete(cleanSym);
                                }, 5000);

                                this.brokerUnsubscribeTimers.set(cleanSym, timer);
                            }
                        }
                    }
                } catch (err: unknown) {
                    logger.warn({ err }, "Malformed WS message received");
                }
            });

            ws.on("close", () => {
                const userSubs = this.subscriptions.get(ws);
                if (userSubs) {
                    const cleanSymbolsToDecrement = new Set<string>();
                    for (const sym of userSubs) {
                        cleanSymbolsToDecrement.add(MarketSymbolMapper.fromFyersSymbol(sym));
                    }

                    for (const cleanSym of cleanSymbolsToDecrement) {
                        const prevCount = this.symbolRefCounts.get(cleanSym) ?? 1;
                        const nextCount = Math.max(0, prevCount - 1);
                        this.symbolRefCounts.set(cleanSym, nextCount);

                        if (nextCount === 0) {
                            const timer = setTimeout(() => {
                                const currentCount = this.symbolRefCounts.get(cleanSym) ?? 0;
                                if (currentCount <= 0) {
                                    logger.info({ cleanSym }, "No remaining subscribers after socket disconnect; unsubscribing broker feed");
                                    void this.marketService.unsubscribe([cleanSym]);
                                }
                                this.brokerUnsubscribeTimers.delete(cleanSym);
                            }, 5000);

                            this.brokerUnsubscribeTimers.set(cleanSym, timer);
                        }
                    }
                }

                this.subscriptions.delete(ws);
                this.socketSubscriptionTimestamps.delete(ws);
                logger.info("Market WS client disconnected");
            });
        });

        // Listen to broker/mock ticks and broadcast to subscribed frontend rooms
        this.marketService.onTick((tick) => {
            const payload = JSON.stringify({
                type: "TICK",
                symbol: tick.symbol,
                data: {
                    ltp: tick.ltp,
                    price: tick.ltp,
                    open: tick.open,
                    high: tick.high,
                    low: tick.low,
                    close: tick.close,
                    volume: tick.volume,
                    timestamp: tick.timestamp,
                },
                ltp: tick.ltp,
                price: tick.ltp,
                change: tick.change,
                changePercent: tick.changePercent,
            });

            const fyersSym = MarketSymbolMapper.toFyersSymbol(tick.symbol);
            const spaceless = tick.symbol.replace(/\s+/g, "");

            for (const [ws, symbols] of this.subscriptions.entries()) {
                const isSubscribed =
                    symbols.has(tick.symbol) ||
                    symbols.has(fyersSym) ||
                    symbols.has(spaceless) ||
                    (tick.symbol === "TATAMOTORS" && symbols.has("TMCV")) ||
                    (tick.symbol === "TMPV" && symbols.has("TATAMOTORSPASSENGER")) ||
                    (tick.symbol === "ZOMATO" && symbols.has("ETERNAL")) ||
                    (tick.symbol === "ETERNAL" && symbols.has("ZOMATO")) ||
                    (tick.symbol === "ICICIPRULI" && symbols.has("ICICILIFE")) ||
                    (tick.symbol === "ICICILIFE" && symbols.has("ICICIPRULI")) ||
                    (tick.symbol === "LTIM" && symbols.has("LTM")) ||
                    (tick.symbol === "LTM" && symbols.has("LTIM"));

                if (ws.readyState === WebSocket.OPEN && isSubscribed) {
                    ws.send(payload);
                }
            }
        });

        logger.info("Market WebSocket Gateway initialized on /ws/market-feed");
    }
}