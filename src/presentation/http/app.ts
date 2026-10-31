import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "../../infrastructure/config/env";
import { ApiRoutes } from "./constants/ApiRoutes";
import appRoutes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { HttpStatus } from "./constants/HttpStatus";
import { ApiResponse } from "./utils/ApiResponse";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";



export const createApp = () => {
    const app = express();

    app.use(cors({
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    }))

    app.use(morgan("dev"));
    app.use(express.json());
    app.use(cookieParser());

    app.use(ApiRoutes.BASE, appRoutes);

    app.use((req, res) => {
        return ApiResponse.error(res, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, "Route not found");
    });

    app.use(errorHandler);

    return app;
}