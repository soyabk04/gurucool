
export class AppError extends Error {
    statusCode: number;
    success: boolean;
    errorCode?: string;
    details?: unknown;

    constructor(
        message: string,
        statusCode = 500,
        errorCode?: string,
        details?: unknown
    ) {
        super(message);

        this.statusCode = statusCode;
        this.success = false;
        this.errorCode = errorCode!;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}