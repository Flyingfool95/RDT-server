export class HttpError extends Error {
    status: number;
    errors: string[] | null; /* Update to be an object with message and path */

    constructor(status: number, message: string, errors: string[] | null = null) {
        super(message);
        this.status = status;
        this.errors = errors;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HttpError);
        }
    }
}
