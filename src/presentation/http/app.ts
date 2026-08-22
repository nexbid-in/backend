import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import appRoutes from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";
import { HttpStatus } from "./constants/HttpStatus";
import { ApiResponse } from "./utils/ApiResponse";
import { ErrorCodes } from "../../shared/errors/ErrorCodes";



export const createApp = () => {
    const app = express();

    app.use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    }))

    app.use(morgan("dev"));
    app.use(express.json());
    app.use(cookieParser());

    app.use("/api", appRoutes);

    app.use((req, res) => {
        return ApiResponse.error(res, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, "Route not found");
    });

    app.use(errorHandler);

    return app;
}