/// <reference path="./types/express.d.ts" />
import http from "http";
import { createApp } from "./presentation/http/app";
import { connectPrisma } from "./infrastructure/database/prisma";
import { connectRedis } from "./infrastructure/config/redis";
import { env } from "./infrastructure/config/env";
import { logger } from "./infrastructure/logging/logger";
import { paymentReconciliationCron } from "./di/wallet/container";
import { marketDataService, fyersTokenRefreshCron } from "./di/market/container";
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
            fyersTokenRefreshCron.start();
        });
    } catch (error: unknown) {
        logger.error({ error }, "Failed to start server");
        process.exit(1);
    }
};

void startServer();



