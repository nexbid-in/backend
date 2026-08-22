import { Response } from "express";

export class ApiResponse {
    static success<T>(res: Response, status: number, message: string, data?: T) {
        return res.status(status).json({
            success: true,
            message,
            ...(data && { data }),
        });
    }

    static error<T = unknown>(res: Response, status: number, code: string, message: string, details?: T) {
        return res.status(status).json({
            success: false,
            error: {
                code,
                message,
                ...(details && { details }),
            }
        });
    }
}