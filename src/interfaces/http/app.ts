import express from "express";


export const createApp = () => {
    const app = express();

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