import "dotenv/config";

import { logger } from "./infrastructure/logging/logger";
import { createApp } from "./interfaces/http/app";

const startServer = async () => {
    try {
        const app = createApp();
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error(error, "Failed to start server");
    }
}


startServer();
