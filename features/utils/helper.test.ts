import { assertStrictEquals, assertThrows, assertEquals, assertRejects } from "jsr:@std/assert";
import { z } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import db from "../../db/db.ts";
import { generateJWT } from "./jwt.ts";
import { HttpError } from "./classes.ts";
import {
    sendResponse,
    sanitizeStrings,
    validateData,
    generateSalt,
    setCookie,
    validateInputData,
    verifyAccessToken,
    deleteJWTTokens,
    getUserIfExists,
} from "./helpers.ts";

// Fake context interface to simulate a request/response environment.
interface FakeContext {
    response: {
        status: number;
        body: any;
    };
    cookies: {
        _cookies: Record<string, any>;
        get(key: string): string | undefined;
        set(key: string, value: string, options?: any): void;
        delete(key: string): void;
    };
}

// Helper function to create a fake context.
function createFakeContext(): FakeContext {
    return {
        response: {
            status: 0,
            body: {},
        },
        cookies: {
            _cookies: {},
            get(key: string) {
                return this._cookies[key]?.value;
            },
            set(key: string, value: string, options?: any) {
                this._cookies[key] = { value, options };
            },
            delete(key: string) {
                delete this._cookies[key];
            },
        },
    };
}

// --- Response Handling Tests ---
Deno.test("sendResponse sets correct response", () => {
    const ctx = createFakeContext();
    sendResponse(ctx as any, 200, { foo: "bar" }, "Ok", null);
    assertStrictEquals(ctx.response.status, 200);
    assertEquals(ctx.response.body, {
        success: true,
        data: { foo: "bar" },
        message: "Ok",
        errors: null,
    });
});

// --- Sanitization Tests ---
Deno.test("sanitizeStrings sanitizes strings and object properties", () => {
    const malicious = "<script>alert('xss')</script>";
    const sanitized = sanitizeStrings(malicious);
    if (typeof sanitized === "string") {
        if (sanitized.includes("<script>") || sanitized.includes("</script>")) {
            throw new Error("String was not sanitized");
        }
    } else {
        throw new Error("Expected a string");
    }

    const inputObj = { name: malicious, age: 30 };
    const sanitizedObj = sanitizeStrings(inputObj) as Record<string, unknown>;
    if (typeof sanitizedObj.name === "string") {
        if (sanitizedObj.name.includes("<script>") || sanitizedObj.name.includes("</script>")) {
            throw new Error("Object string property was not sanitized");
        }
    }
    assertStrictEquals(sanitizedObj.age, 30);
});

// Additional tests for nested objects and arrays in sanitizeStrings.
Deno.test("sanitizeStrings sanitizes nested objects and arrays", () => {
    const malicious = "<script>alert('xss')</script>";
    const input = {
        user: {
            name: malicious,
            details: {
                bio: `Hello ${malicious}`,
            },
            tags: [malicious, "safe"],
        },
        count: 42,
    };

    const sanitized = sanitizeStrings(input) as Record<string, any>;
    if (sanitized.user.name.includes("<script>")) {
        throw new Error("Nested object property was not sanitized");
    }
    if (sanitized.user.details.bio.includes("<script>")) {
        throw new Error("Deeply nested object property was not sanitized");
    }
    // Check that array elements are sanitized.
    if (Array.isArray(sanitized.user.tags)) {
        sanitized.user.tags.forEach((tag: string) => {
            if (typeof tag === "string" && tag.includes("<script>")) {
                throw new Error("Array element was not sanitized");
            }
        });
    }
    assertStrictEquals(sanitized.count, 42);
});

// --- Data Validation Tests ---
Deno.test("validateData works with valid data", () => {
    const schema = z.object({ name: z.string() });
    const data = { name: "John" };
    const result = validateData(schema, data);
    assertEquals(result, data);
});

Deno.test("validateData throws on invalid data", () => {
    const schema = z.object({ name: z.string() });
    assertThrows(
        () => {
            validateData(schema, {});
        },
        HttpError,
        "Validation error"
    );
});

// --- Salt Generation Tests ---
Deno.test("generateSalt returns Uint8Array of correct length", () => {
    const length = 16;
    const salt = generateSalt(length);
    assertStrictEquals(salt instanceof Uint8Array, true);
    assertStrictEquals(salt.length, length);
});

// --- Cookie Management Tests ---
Deno.test("Cookie management", async (t) => {
    await t.step("setCookie sets cookie with correct options", () => {
        const ctx = createFakeContext();

        // Set production environment variable to test secure defaults.
        Deno.env.set("DENO_ENV", "production");

        setCookie(ctx as any, "test", "value", { maxAge: 1000, secure: true });

        const cookie = ctx.cookies._cookies["test"];
        if (!cookie) throw new Error("Cookie not set");

        assertStrictEquals(cookie.value, "value");
        assertStrictEquals(cookie.options.httpOnly, true);
        assertStrictEquals(cookie.options.sameSite, "strict");
        assertStrictEquals(cookie.options.path, "/");
        assertStrictEquals(cookie.options.maxAge, 1000);
        assertStrictEquals(cookie.options.secure, true);

        // Clean up environment variable.
        Deno.env.delete("DENO_ENV");
    });

    await t.step("deleteJWTTokens deletes both tokens", () => {
        const ctx = createFakeContext();
        ctx.cookies.set("access_token", "some_token");
        ctx.cookies.set("refresh_token", "some_token");
        deleteJWTTokens(ctx as any);
        assertStrictEquals(ctx.cookies.get("access_token"), undefined);
        assertStrictEquals(ctx.cookies.get("refresh_token"), undefined);
    });
});

// --- Input Data Validation Tests ---
Deno.test("validateInputData works with valid data", () => {
    const schema = z.object({ email: z.string().email() });
    const data = { email: "test@example.com" };
    const result = validateInputData(schema, data);
    assertEquals(result, data);
});

Deno.test("validateInputData throws on invalid data", () => {
    const schema = z.object({ email: z.string().email() });
    assertThrows(() => {
        validateInputData(schema, { email: "invalid" });
    }, Error);
});

// --- JWT Verification Tests ---
Deno.test("JWT verification", async (t) => {
    await t.step("verifyAccessToken returns payload for valid token", async () => {
        const ctx = createFakeContext();

        const validToken = await generateJWT(
            {
                id: "123",
                email: "test@example.com",
                name: "Test",
                role: "user",
            },
            900
        );

        setCookie(ctx as any, "access_token", validToken, { maxAge: 900 });

        const payload = await verifyAccessToken(ctx as any);
        assertStrictEquals(payload.email, "test@example.com");
    });

    await t.step("verifyAccessToken throws when token is missing", async () => {
        const ctx = createFakeContext();
        await assertRejects(() => verifyAccessToken(ctx as any), HttpError, "Unauthorized");
    });

    await t.step("verifyAccessToken deletes cookies and throws on expired token", async () => {
        const ctx = createFakeContext();

        const expiredToken = await generateJWT(
            {
                id: "123",
            },
            0
        );

        setCookie(ctx as any, "access_token", expiredToken, { maxAge: 0 });
        setCookie(ctx as any, "refresh_token", expiredToken, { maxAge: 0 });

        await assertRejects(() => verifyAccessToken(ctx as any), HttpError, "Unauthorized");

        // Ensure cookies are deleted.
        assertStrictEquals(ctx.cookies.get("access_token"), undefined);
        assertStrictEquals(ctx.cookies.get("refresh_token"), undefined);
    });
});

// --- Database Query Tests ---
Deno.test("getUserIfExists returns user data if exists", () => {
    const originalQuery = db.query;
    try {
        // Monkey-patch db.query to simulate user data.
        db.query = (_query: string, params: any[]) => {
            if (params[0] === "existing@example.com") {
                return [[1, "existing@example.com", "Existing User", "ignored", "user", "hashedpassword"]];
            }
            return [];
        };

        const user = getUserIfExists("email", "existing@example.com");
        assertEquals(user, {
            id: 1,
            email: "existing@example.com",
            name: "Existing User",
            role: "user",
            password: "hashedpassword",
        });

        const nonUser = getUserIfExists("email", "nonexistent@example.com");
        assertStrictEquals(nonUser, null);
    } finally {
        // Restore original db.query implementation.
        db.query = originalQuery;
    }
});
