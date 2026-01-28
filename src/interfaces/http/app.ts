import express from "express";
import morgan from "morgan";

import appRoutes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { HttpStatus } from "./constants/HttpStatus";



export const createApp = () => {
    const app = express();

    app.use(morgan("dev"));
    app.use(express.json());

    app.use("/api", appRoutes);

    app.use((req, res) => {
        res.status(HttpStatus.NOT_FOUND).json({
            success: false,
            error: {
                code: "NOT_FOUND",
                message: "Route not found",
            },
        });
    });

    app.use(errorHandler);

    return app;
}