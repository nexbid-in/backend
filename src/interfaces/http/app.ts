import express from "express";
import morgan from "morgan";

import { prisma } from "../../infrastructure/database/prisma";
import { logger } from "../../infrastructure/logging/logger";


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

    app.post("/register", async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required!"});
            }

            const user = await prisma.user.create({
                data: { email, name, password }
            });

            res.status(201).json(user);
        } catch (error: any) {
            logger.error(error)
            res.status(500).json({message: error.message});
        }
    });

    app.get("/getusers", async (req, res) => {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    });

    return app;
}