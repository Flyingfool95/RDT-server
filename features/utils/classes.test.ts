// HttpError.test.ts
import { HttpError } from "./classes.ts";

Deno.test("should create an instance of HttpError with the correct properties", () => {
    const status = 400;
    const message = "Bad Request";
    const errors = ["Invalid input"];

    const error = new HttpError(status, message, errors);

    if (!(error instanceof HttpError)) {
        throw new Error("Error is not an instance of HttpError");
    }

    if (error.status !== status) {
        throw new Error(`Expected status ${status}, but got ${error.status}`);
    }
    if (error.message !== message) {
        throw new Error(`Expected message "${message}", but got "${error.message}"`);
    }
    if (JSON.stringify(error.errors) !== JSON.stringify(errors)) {
        throw new Error(`Expected errors ${JSON.stringify(errors)}, but got ${JSON.stringify(error.errors)}`);
    }
});

Deno.test("should set errors to null if not provided", () => {
    const status = 404;
    const message = "Not Found";

    const error = new HttpError(status, message);

    if (error.errors !== null) {
        throw new Error(`Expected errors to be null, but got ${error.errors}`);
    }
});

Deno.test("should correctly inherit from Error", () => {
    const status = 500;
    const message = "Internal Server Error";
    const error = new HttpError(status, message);

    if (!(error instanceof Error)) {
        throw new Error("HttpError is not an instance of Error");
    }
});

Deno.test("should capture stack trace if available", () => {
    const status = 500;
    const message = "Internal Server Error";
    const error = new HttpError(status, message);

    if (!error.stack) {
        throw new Error("Stack trace is missing");
    }
});
