import express from "express";
import morgan from "morgan";


export const createApp = () => {
    const app = express();

    app.use(morgan("dev"));
    app.use(express.json());

    app.get("/health", (req, res) => {
        res.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    return app;
}