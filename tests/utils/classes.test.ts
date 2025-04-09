import { assertInstanceOf, assertEquals, assert } from "jsr:@std/assert";
import { HttpError } from "../../features/utils/classes.ts";

Deno.test("should create an instance of HttpError with the correct properties", () => {
    const status = 400;
    const message = "Bad Request";
    const errors = ["Invalid input"];

    const error = new HttpError(status, message, errors);

    assertInstanceOf(error, HttpError);
    assertEquals(error.status, status);
    assertEquals(error.message, message);
    assertEquals(error.errors, errors);
});

Deno.test("should set errors to null if not provided", () => {
    const status = 404;
    const message = "Not Found";

    const error = new HttpError(status, message);

    assertEquals(error.errors, null);
});

Deno.test("should correctly inherit from Error", () => {
    const status = 500;
    const message = "Internal Server Error";
    const error = new HttpError(status, message);

    assertInstanceOf(error, Error);
});

Deno.test("should capture stack trace if available", () => {
    const status = 500;
    const message = "Internal Server Error";
    const error = new HttpError(status, message);

    assert(error.stack, "Stack trace is missing");
});
