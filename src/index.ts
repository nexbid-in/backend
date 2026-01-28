import "dotenv/config";

import { logger } from "./infrastructure/logging/logger";
import { createApp } from "./interfaces/http/app";
import { connectPrisma } from "./infrastructure/database/prisma";
import { connectRedis } from "./infrastructure/config/redis";

const startServer = async () => {
    try {
        const app = createApp();
        
        await connectPrisma();

        await connectRedis();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error(error, "Failed to start server");
        process.exit(1);
    }
}


startServer();
