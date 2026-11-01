# Nexbid Real Indian Stock Market Data Integration Plan
> **Production-grade Market Gateway Architecture for Indian Markets (NSE/BSE) powering `klinecharts-pro`**

---

## 1. Architectural Blueprint

In production, frontend charting libraries like `klinecharts-pro` must **never** connect directly to broker APIs (e.g., Fyers, Upstox, Zerodha). Broker credentials must stay on the server, connection quotas are limited (typically 1–5 WebSocket connections per account), and high-frequency exchange ticks must be filtered, cached, and fanned out efficiently.

### System Flow Diagram

```mermaid
flowchart TD
    subgraph IndianExchanges [Indian Exchanges]
        NSE[NSE / BSE]
    end

    subgraph DataProvider [Broker / Data Vendor]
        BrokerWS[Fyers v3 / Upstox v2 WebSocket]
        BrokerREST[Broker REST Data API]
    end

    subgraph NexbidBackend [Nexbid Backend Gateway]
        subgraph InfrastructureLayer [Infrastructure Layer]
            BrokerAdapter[Broker Gateway Adapter]
            MockAdapter[Dev/Mock Market Simulator]
            Redis[(Redis Cache & Pub/Sub)]
            WS_Gateway[WebSocket Server (/ws/market-feed)]
        end

        subgraph ApplicationLayer [Application Layer]
            GetHistoryUC[GetHistoricalCandlesUseCase]
            GetQuoteUC[GetMarketQuoteUseCase]
            TickFanoutService[MarketTickFanoutService]
        end

        subgraph PresentationLayer [Presentation Layer]
            MarketController[MarketController (/api/v1/market)]
            WS_Handler[WebSocket Client Connection Handler]
        end
    end

    subgraph NexbidFrontend [Frontend Client]
        Datafeed[NexbidRealtimeDatafeed]
        Chart[KLineChartPro]
    end

    NSE --> BrokerWS & BrokerREST
    BrokerREST --> BrokerAdapter
    BrokerWS -->|Single Master Stream| BrokerAdapter

    BrokerAdapter -->|Cache Completed Candles| Redis
    BrokerAdapter -->|Publish Live Ticks| TickFanoutService

    MockAdapter -.->|Fallback on Weekends/Nights| TickFanoutService & Redis

    TickFanoutService -->|Broadcast to Subscribed Rooms| WS_Gateway
    Redis -->|Fetch Cached Candles| GetHistoryUC

    GetHistoryUC --> MarketController
    MarketController -->|REST: GET /api/v1/market/history| Datafeed
    WS_Gateway -->|WS: Ticks (LTP, Vol, Change)| Datafeed
    Datafeed --> Chart
```

---

## 2. Indian Market Standards & Operational Constraints

1. **Exchange Trading Hours (IST / Asia/Kolkata)**:
   - **Pre-Open Session**: 09:00 AM – 09:08 AM IST
   - **Normal Trading**: 09:15 AM – 03:30 PM IST (Monday to Friday)
   - **Market Closed**: Weekends, national trading holidays, and after 03:30 PM IST.
   - *Architecture standard*: When market is closed, live tick streams halt. Your backend must serve the last finalized closing candle and prevent UI crash. During development, a **Mock/Dev Market Simulator** allows UI and charting development 24/7.

2. **SEBI Daily Authentication Rule**:
   - Indian broker tokens expire **every morning between 05:00 AM and 06:00 AM IST**.
   - Tokens cannot be static. A morning cron job or helper script automates login via TOTP (`otplib`) and stores the valid `access_token` in Redis with a 24-hour TTL.

3. **Symbol Format Mapping**:
   - Internal Nexbid symbol: `RELIANCE`, `TCS`, `INFY`, `NIFTY50`
   - Fyers API v3 symbol: `NSE:RELIANCE-EQ`, `NSE:TCS-EQ`, `NSE:NIFTY50-INDEX`
   - Upstox API v2 symbol: `NSE_EQ|INE002A01018`
   - *Architecture standard*: A Symbol Translator utility translates internal symbols to broker-specific symbols and vice-versa.

4. **Candle Alignment & Timestamps**:
   - `klinecharts-pro` requires timestamps in **milliseconds** (`timestamp: number`).
   - Intraday candles strictly start at `09:15:00 IST` (e.g., 15m candles: `09:15`, `09:30`, `09:45`).
   - Never align intraday candles to UTC midnight; always align relative to IST market open.

---

## 3. Clean Architecture Layer Structure

Aligning with Nexbid's current architecture, the market components map as follows:

```
src/
├── domain/
│   └── entities/
│       └── market/
│           ├── Candle.ts                <-- Candle & KLine value objects
│           └── MarketTick.ts            <-- Real-time tick value object
├── application/
│   ├── dto/
│   │   └── market/
│   │       ├── HistoricalCandleDTO.ts   <-- Request / Response DTOs
│   │       └── MarketQuoteDTO.ts
│   ├── interface/
│   │   └── services/
│   │       └── IMarketDataService.ts    <-- Contract for market data providers
│   └── use-cases/
│       └── market/
│           ├── GetHistoricalCandlesUseCase.ts
│           └── GetMarketQuoteUseCase.ts
├── infrastructure/
│   ├── config/
│   │   └── env.ts                       <-- Add FYERS / UPSTOX configs
│   ├── external/
│   │   └── market/
│   │       ├── FyersMarketService.ts    <-- Official broker adapter
│   │       ├── MockMarketService.ts     <-- Off-market simulator
│   │       └── MarketSymbolMapper.ts    <-- Symbol translation
│   └── websocket/
│       └── MarketWebSocketGateway.ts    <-- WebSocket fanout manager
├── presentation/
│   └── http/
│       ├── constants/
│       │   └── ApiRoutes.ts             <-- Add MARKET routes
│       ├── controllers/
│       │   └── market/
│       │       └── MarketController.ts  <-- Express Controller
│       └── routes/
│           └── market/
│               └── market.routes.ts     <-- Express Router
├── di/
│   └── market/
│       └── container.ts                 <-- Dependency injection wiring
└── index.ts                             <-- HTTP + WS Server startup
```

---

## 4. Step-by-Step Implementation Guide

### Step 1: Update Environment Configuration

In `.env`:
```env
# =============================================================
# MARKET DATA PROVIDER (FYERS API v3)
# =============================================================
MARKET_DATA_PROVIDER=mock          # Options: "mock" | "fyers"
FYERS_APP_ID=your_fyers_app_id     # Format: xxxxxx-100
FYERS_SECRET_KEY=your_secret_key
FYERS_ACCESS_TOKEN=                # Set automatically by auth script or manually
```

In `src/infrastructure/config/env.ts`, add the validation rules:
```ts
// Add to envSchema in src/infrastructure/config/env.ts
MARKET_DATA_PROVIDER: z.enum(["mock", "fyers"]).default("mock"),
FYERS_APP_ID: z.string().optional(),
FYERS_SECRET_KEY: z.string().optional(),
FYERS_ACCESS_TOKEN: z.string().optional(),
```

---

### Step 2: Domain Layer Entities & Value Objects

Create `src/domain/entities/market/Candle.ts`:
```ts
export interface Candle {
  timestamp: number; // UTC millisecond timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
}
```

Create `src/domain/entities/market/MarketTick.ts`:
```ts
export interface MarketTick {
  symbol: string;         // e.g. "RELIANCE"
  ltp: number;            // Last Traded Price
  open: number;
  high: number;
  low: number;
  close: number;          // Previous Close
  change: number;         // Net Change (ltp - close)
  changePercent: number;  // (change / close) * 100
  volume: number;
  timestamp: number;      // UTC millisecond timestamp
}
```

---

### Step 3: Application Interface & DTOs

Create `src/application/interface/services/IMarketDataService.ts`:
```ts
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

export interface IMarketDataService {
  getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]>;

  getQuote(symbol: string): Promise<MarketTick | null>;

  subscribe(symbols: string[]): Promise<void>;
  unsubscribe(symbols: string[]): Promise<void>;

  onTick(callback: (tick: MarketTick) => void): void;
}
```

Create `src/application/use-cases/market/GetHistoricalCandlesUseCase.ts`:
```ts
import { IMarketDataService } from "../../interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCodes } from "../../../shared/errors/ErrorCodes";

export class GetHistoricalCandlesUseCase {
  constructor(private readonly marketService: IMarketDataService) {}

  async execute(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    if (!symbol) {
      throw new AppError(ErrorCodes.VALIDATION_FAILED, "Stock symbol is required");
    }

    // Default: fetch last 30 days if range is omitted
    const toTimestamp = to || Date.now();
    const fromTimestamp = from || toTimestamp - 30 * 24 * 60 * 60 * 1000;

    return await this.marketService.getHistoricalCandles(
      symbol.toUpperCase().trim(),
      resolution,
      fromTimestamp,
      toTimestamp
    );
  }
}
```

---

### Step 4: Infrastructure Layer (Broker Adapter & Redis Cache)

#### Symbol Mapper Utility (`src/infrastructure/external/market/MarketSymbolMapper.ts`):
```ts
export class MarketSymbolMapper {
  static toFyersSymbol(symbol: string): string {
    const clean = symbol.toUpperCase().trim();
    if (clean === "NIFTY50" || clean === "NIFTY") return "NSE:NIFTY50-INDEX";
    if (clean === "BANKNIFTY") return "NSE:NIFTYBANK-INDEX";
    return `NSE:${clean}-EQ`;
  }

  static fromFyersSymbol(fyersSymbol: string): string {
    return fyersSymbol
      .replace("NSE:", "")
      .replace("-EQ", "")
      .replace("-INDEX", "");
  }
}
```

#### Fyers Broker Adapter (`src/infrastructure/external/market/FyersMarketService.ts`):
```ts
import axios from "axios";
import redis from "../../config/redis";
import { env } from "../../config/env";
import { logger } from "../../logging/logger";
import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";
import { MarketSymbolMapper } from "./MarketSymbolMapper";

export class FyersMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];

  private async getAccessToken(): Promise<string> {
    const token = (await redis.get("market:fyers:access_token")) || env.FYERS_ACCESS_TOKEN;
    if (!token) {
      throw new Error("Active Fyers access token not found in Redis or .env");
    }
    return token;
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const cacheKey = `market:candles:${symbol}:${resolution}:${Math.floor(from / 60000)}:${Math.floor(to / 60000)}`;

    // 1. Check Redis Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const token = await this.getAccessToken();
    const fyersSymbol = MarketSymbolMapper.toFyersSymbol(symbol);

    // Map resolutions: "1", "5", "15", "60", "D"
    const fyersResolution = resolution === "1D" || resolution === "D" ? "D" : resolution;

    try {
      const response = await axios.get("https://api-t1.fyers.in/data/history", {
        headers: { Authorization: `${env.FYERS_APP_ID}:${token}` },
        params: {
          symbol: fyersSymbol,
          resolution: fyersResolution,
          date_format: "0", // 0 = Epoch timestamp
          range_from: Math.floor(from / 1000),
          range_to: Math.floor(to / 1000),
        },
      });

      if (response.data.s !== "ok" || !response.data.candles) {
        logger.warn({ data: response.data, symbol }, "Fyers returned non-ok candle response");
        return [];
      }

      // Format: [ [epoch_sec, open, high, low, close, volume], ... ]
      const candles: Candle[] = response.data.candles.map((c: number[]) => ({
        timestamp: c[0] * 1000, // convert seconds to milliseconds
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));

      // Cache historical data (1 day for Daily candles, 5 min for Intraday)
      const ttl = resolution === "D" ? 86400 : 300;
      await redis.setex(cacheKey, ttl, JSON.stringify(candles));

      return candles;
    } catch (error) {
      logger.error({ error, symbol }, "Failed to fetch historical candles from Fyers");
      return [];
    }
  }

  async getQuote(symbol: string): Promise<MarketTick | null> {
    // Implement Fyers Quotes API: GET /data/quotes?symbols=...
    return null;
  }

  async subscribe(symbols: string[]): Promise<void> {
    // Subscribe to Fyers WebSocket feed
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    // Unsubscribe from Fyers WebSocket feed
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }
}
```

#### Development & Weekend Mock Simulator (`src/infrastructure/external/market/MockMarketService.ts`):
*Allows testing charts anytime outside Indian market hours.*
```ts
import { IMarketDataService } from "../../../application/interface/services/IMarketDataService";
import { Candle } from "../../../domain/entities/market/Candle";
import { MarketTick } from "../../../domain/entities/market/MarketTick";

export class MockMarketService implements IMarketDataService {
  private tickCallbacks: Array<(tick: MarketTick) => void> = [];
  private activeSubscriptions = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMockTickGenerator();
  }

  async getHistoricalCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<Candle[]> {
    const candles: Candle[] = [];
    const intervalMs = resolution === "D" ? 86400000 : parseInt(resolution, 10) * 60000 || 900000;
    let basePrice = symbol.includes("NIFTY") ? 24500 : 2500;
    
    for (let time = from; time <= to; time += intervalMs) {
      const delta = (Math.random() - 0.49) * (basePrice * 0.005);
      const open = basePrice;
      const close = basePrice + delta;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.002);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.002);
      const volume = Math.floor(Math.random() * 50000) + 1000;

      candles.push({ timestamp: time, open, high, low, close, volume });
      basePrice = close;
    }
    return candles;
  }

  async getQuote(symbol: string): Promise<MarketTick | null> {
    return null;
  }

  async subscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => this.activeSubscriptions.add(s));
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    symbols.forEach((s) => this.activeSubscriptions.delete(s));
  }

  onTick(callback: (tick: MarketTick) => void): void {
    this.tickCallbacks.push(callback);
  }

  private startMockTickGenerator() {
    this.timer = setInterval(() => {
      if (this.activeSubscriptions.size === 0) return;

      this.activeSubscriptions.forEach((symbol) => {
        const ltp = +(2500 + (Math.random() - 0.5) * 10).toFixed(2);
        const tick: MarketTick = {
          symbol,
          ltp,
          open: 2490,
          high: 2515,
          low: 2480,
          close: 2495,
          change: +(ltp - 2495).toFixed(2),
          changePercent: +(((ltp - 2495) / 2495) * 100).toFixed(2),
          volume: Math.floor(Math.random() * 1000) + 10,
          timestamp: Date.now(),
        };

        this.tickCallbacks.forEach((cb) => cb(tick));
      });
    }, 1000);
  }
}
```

---

### Step 5: Presentation Layer (REST Endpoints)

#### 1. Add Route Constants (`src/presentation/http/constants/ApiRoutes.ts`):
```ts
// Add under ApiRoutes object:
MARKET: {
  BASE: "/market",
  HISTORY: "/history",
  QUOTE: "/quote",
},
```

#### 2. Create Controller (`src/presentation/http/controllers/market/MarketController.ts`):
```ts
import { Request, Response } from "express";
import { GetHistoricalCandlesUseCase } from "../../../../application/use-cases/market/GetHistoricalCandlesUseCase";
import { ApiResponse } from "../../utils/ApiResponse";
import { HttpStatus } from "../../constants/HttpStatus";

export class MarketController {
  constructor(private readonly getCandlesUseCase: GetHistoricalCandlesUseCase) {}

  async getHistory(req: Request, res: Response) {
    const { symbol, resolution = "15", from, to } = req.query;

    const fromTimestamp = from ? Number(from) : undefined;
    const toTimestamp = to ? Number(to) : undefined;

    const candles = await this.getCandlesUseCase.execute(
      String(symbol || ""),
      String(resolution),
      fromTimestamp as number,
      toTimestamp as number
    );

    return ApiResponse.success(res, HttpStatus.OK, "Historical data fetched", candles);
  }
}
```

#### 3. Create Router (`src/presentation/http/routes/market/market.routes.ts`):
```ts
import { Router } from "express";
import { marketController } from "../../../../di/market/container";
import { ApiRoutes } from "../../constants/ApiRoutes";

const router = Router();

router.get(ApiRoutes.MARKET.HISTORY, marketController.getHistory.bind(marketController));

export default router;
```

#### 4. Register in Main Router (`src/presentation/http/routes/index.ts`):
```ts
import marketRoutes from "./market/market.routes";
// ...
router.use(ApiRoutes.MARKET.BASE, marketRoutes);
```

---

### Step 6: Presentation Layer (WebSocket Fanout Gateway)

Create `src/infrastructure/websocket/MarketWebSocketGateway.ts`:
```ts
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../logging/logger";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";

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

      ws.on("message", (raw: string) => {
        try {
          const message = JSON.parse(raw);
          const userSubs = this.subscriptions.get(ws);

          if (message.action === "subscribe" && message.symbol) {
            const sym = message.symbol.toUpperCase();
            userSubs?.add(sym);
            this.marketService.subscribe([sym]);
          } else if (message.action === "unsubscribe" && message.symbol) {
            const sym = message.symbol.toUpperCase();
            userSubs?.delete(sym);
          }
        } catch (err) {
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
```

---

### Step 7: Dependency Injection Wiring

Create `src/di/market/container.ts`:
```ts
import { env } from "../../infrastructure/config/env";
import { IMarketDataService } from "../../application/interface/services/IMarketDataService";
import { FyersMarketService } from "../../infrastructure/external/market/FyersMarketService";
import { MockMarketService } from "../../infrastructure/external/market/MockMarketService";
import { GetHistoricalCandlesUseCase } from "../../application/use-cases/market/GetHistoricalCandlesUseCase";
import { MarketController } from "../../presentation/http/controllers/market/MarketController";

// 1. Service Provider Selection (Mock or Fyers)
export const marketDataService: IMarketDataService =
  env.MARKET_DATA_PROVIDER === "fyers"
    ? new FyersMarketService()
    : new MockMarketService();

// 2. Use Cases
export const getHistoricalCandlesUseCase = new GetHistoricalCandlesUseCase(marketDataService);

// 3. Controllers
export const marketController = new MarketController(getHistoricalCandlesUseCase);
```

---

### Step 8: Mount HTTP & WebSocket Server in `src/index.ts`

Update `src/index.ts` to wrap Express in Node's `http.createServer`:

```ts
import http from "http";
import { createApp } from "./presentation/http/app";
import { connectPrisma } from "./infrastructure/database/prisma";
import { connectRedis } from "./infrastructure/config/redis";
import { env } from "./infrastructure/config/env";
import { logger } from "./infrastructure/logging/logger";
import { paymentReconciliationCron } from "./di/wallet/container";
import { marketDataService } from "./di/market/container";
import { MarketWebSocketGateway } from "./infrastructure/websocket/MarketWebSocketGateway";

const startServer = async () => {
  try {
    const app = createApp();
    const server = http.createServer(app);

    await connectPrisma();
    await connectRedis();

    // Attach Market WebSocket Server
    new MarketWebSocketGateway(server, marketDataService);

    const PORT = env.PORT;
    server.listen(PORT, () => {
      logger.info(`Server is running at http://localhost:${PORT}`);
      paymentReconciliationCron.start();
    });
  } catch (error: unknown) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
```

---

## 5. Frontend Contract Alignment (`klineDatafeed.ts`)

Once your backend is running:

1. **REST History Endpoint**:
   - URL: `GET http://localhost:7000/api/market/history?symbol=RELIANCE&resolution=15`
   - Response:
     ```json
     {
       "success": true,
       "message": "Historical data fetched",
       "data": [
         {
           "timestamp": 1729837800000,
           "open": 2680.50,
           "high": 2692.00,
           "low": 2678.00,
           "close": 2688.25,
           "volume": 125400
         }
       ]
     }
     ```
2. **WebSocket Realtime Feed**:
   - URL: `ws://localhost:7000/ws/market-feed`
   - Client sends:
     ```json
     { "action": "subscribe", "symbol": "RELIANCE" }
     ```
   - Server streams:
     ```json
     {
       "type": "TICK",
       "symbol": "RELIANCE",
       "data": {
         "ltp": 2689.50,
         "volume": 126100,
         "timestamp": 1729837862000
       },
       "change": 9.25,
       "changePercent": 0.35
     }
     ```

---

## 6. Implementation Checklist

- [ ] **Config**: Add `MARKET_DATA_PROVIDER` & broker credentials to `.env` and `src/infrastructure/config/env.ts`
- [ ] **Domain**: Create `Candle.ts` and `MarketTick.ts` in `src/domain/entities/market/`
- [ ] **Contracts**: Create `IMarketDataService.ts` in `src/application/interface/services/`
- [ ] **Use Cases**: Create `GetHistoricalCandlesUseCase.ts` in `src/application/use-cases/market/`
- [ ] **Infrastructure**:
  - [ ] Implement `MarketSymbolMapper.ts`
  - [ ] Implement `MockMarketService.ts` (for immediate local testing)
  - [ ] Implement `FyersMarketService.ts` (for live Indian market data)
- [ ] **WebSocket Gateway**: Create `MarketWebSocketGateway.ts` with room-based subscription
- [ ] **Presentation**:
  - [ ] Add `MARKET` paths in `ApiRoutes.ts`
  - [ ] Create `MarketController.ts` and `market.routes.ts`
  - [ ] Mount routes in `src/presentation/http/routes/index.ts`
- [ ] **Wiring**:
  - [ ] Create `src/di/market/container.ts`
  - [ ] Wrap Express with `http.createServer(app)` in `src/index.ts`
- [ ] **Verification**:
  - [ ] Test `GET /api/market/history?symbol=RELIANCE&resolution=15` in Postman / Browser
  - [ ] Test WebSocket connection via Postman or browser console
  - [ ] Connect `NexbidRealtimeDatafeed` in the frontend repo
