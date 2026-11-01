import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { logger } from "../logging/logger";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";

interface ClientWsMessage {
    action: "subscribe" | "unsubscribe";
    symbol: string;
}

export class MarketWebSocketGateway {
    private wss: WebSocketServer;
    private subscriptions = new Map<WebSocket, Set<string>>();

    constructor(server: HttpServer, private readonly marketService: IMarketDataService) {
        this.wss = new WebSocketServer({ server, path: "/ws/market-feed" });
        this.initialize();
    }

    private initialize() {
        this.wss.on("connection", (ws: WebSocket) => {
            this.subscriptions.set(ws, new Set());

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
                        const sym = String(message.symbol).toUpperCase();

                        if (message.action === "subscribe") {
                            userSubs?.add(sym);
                            void this.marketService.subscribe([sym]);
                        } else if (message.action === "unsubscribe") {
                            userSubs?.delete(sym);
                            void this.marketService.unsubscribe([sym]);
                        }
                    }
                } catch (err: unknown) {
                    logger.warn({ err }, "Malformed WS message received");
                }
            });

            ws.on("close", () => {
                this.subscriptions.delete(ws);
            });
        });

        // Listen to broker/mock ticks and broadcast to subscribed frontend rooms
        this.marketService.onTick((tick) => {
            const payload = JSON.stringify({
                type: "TICK",
                symbol: tick.symbol,
                data: {
                    ltp: tick.ltp,
                    volume: tick.volume,
                    timestamp: tick.timestamp,
                },
                change: tick.change,
                changePercent: tick.changePercent,
            });

            for (const [ws, symbols] of this.subscriptions.entries()) {
                if (ws.readyState === WebSocket.OPEN && symbols.has(tick.symbol)) {
                    ws.send(payload);
                }
            }
        });

        logger.info("Market WebSocket Gateway initialized on /ws/market-feed");
    }
}