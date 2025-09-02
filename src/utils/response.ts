import { Response } from "express";

interface Pagination {
    page: number,
    limit: number,
    total: number,
    totalPages: number,

}

interface SendResponseOptions<T> {
    res: Response;
    statusCode: number;
    status: "success" | "error";
    message: string;
    data?: T | null; // Generic type for the data
    error?: string | null;
    pagination?: Pagination
}

export const sendResponse = <T>({
    res,
    statusCode,
    status,
    message,
    data = null,
    error = null,
}: SendResponseOptions<T>): void => {
    res.status(statusCode).json({
        status,
        message,
        data,
        error,
        timestamp: new Date().toISOString(),
    });
};
