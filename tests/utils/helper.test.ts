// deno-lint-ignore-file no-explicit-any

import { assertStrictEquals, assertThrows, assertEquals, assertRejects, assert } from "jsr:@std/assert";
import { z } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import db from "../../db/db.ts";
import { generateJWT, verifyAccessToken } from "../../features/utils/jwt.ts";
import { HttpError } from "../../features/utils/classes.ts";
import {
    sendResponse,
    sanitizeStrings,
    validateInputData,
    generateSalt,
    getIfExists,
} from "../../features/utils/helpers.ts";
import { removeCookies, setCookie } from "../../features/utils/cookies.ts";

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
Deno.test("sanitizeStrings should sanitize string inputs", () => {
    const malicious = "<script>alert('xss')</script>";
    const sanitized = sanitizeStrings(malicious);

    assert(typeof sanitized === "string", "Expected output to be a string");

    assert(!sanitized.includes("<script>") && !sanitized.includes("</script>"), "String was not sanitized");
});

Deno.test("sanitizeStrings should sanitize object properties and preserve non-string values", () => {
    const malicious = "<script>alert('xss')</script>";
    const inputObj = { name: malicious, age: 30 };
    const sanitizedObj = sanitizeStrings(inputObj) as Record<string, unknown>;

    assert(typeof sanitizedObj.name === "string", "Expected sanitized object property 'name' to be a string");
    assert(
        !(sanitizedObj.name as string).includes("<script>") && !(sanitizedObj.name as string).includes("</script>"),
        "Object string property was not sanitized"
    );

    assertStrictEquals(sanitizedObj.age, 30, "Non-string property 'age' was changed");
});

Deno.test("sanitizeStrings should sanitize nested object properties", () => {
    const malicious = "<script>alert('xss')</script>";
    const input = {
        user: {
            name: malicious,
            details: {
                bio: `Hello ${malicious}`,
            },
        },
    };

    const sanitized = sanitizeStrings(input) as Record<string, any>;

    assert(!sanitized.user.name.includes("<script>"), "Nested object property 'name' was not sanitized");
    assert(!sanitized.user.details.bio.includes("<script>"), "Deeply nested object property 'bio' was not sanitized");
});

Deno.test("sanitizeStrings should sanitize array elements", () => {
    const malicious = "<script>alert('xss')</script>";
    const input = {
        user: {
            tags: [malicious, "safe"],
        },
    };

    const sanitized = sanitizeStrings(input) as Record<string, any>;

    if (Array.isArray(sanitized.user.tags)) {
        sanitized.user.tags.forEach((tag: string) => {
            assert(!tag.includes("<script>"), "An element in the tags array was not sanitized");
        });
    }
});

Deno.test("sanitizeStrings should leave non-string values unchanged", () => {
    const input = { count: 42 };

    const sanitized = sanitizeStrings(input) as Record<string, any>;

    assertEquals(sanitized.count, 42, "Non-string value 'count' was changed unexpectedly");
});

// --- Data Validation Tests ---
Deno.test("validateInputData passes with valid name schema", () => {
    const schema = z.object({ name: z.string() });
    const data = { name: "John" };
    const result = validateInputData(schema, data);
    assertEquals(result, data);
});

Deno.test("validateInputData passes with valid email schema", () => {
    const schema = z.object({ email: z.string().email() });
    const data = { email: "test@example.com" };
    const result = validateInputData(schema, data);
    assertEquals(result, data);
});

Deno.test("validateInputData throws on missing required name field", () => {
    const schema = z.object({ name: z.string() });
    assertThrows(
        () => {
            validateInputData(schema, {});
        },
        HttpError,
        "Validation error"
    );
});

Deno.test("validateInputData throws on invalid email format", () => {
    const schema = z.object({ email: z.string().email() });
    assertThrows(() => {
        validateInputData(schema, { email: "invalid" });
    }, HttpError); // You can use HttpError if that's consistent with your function
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

        Deno.env.delete("DENO_ENV");
    });

    await t.step("removeCookies deletes both tokens", () => {
        const ctx = createFakeContext();
        ctx.cookies.set("access_token", "some_token");
        ctx.cookies.set("refresh_token", "some_token");
        removeCookies(ctx as any, [
            { name: "access_token", path: "/" },
            { name: "refresh_token", path: "/api/v1/auth/refresh-tokens" },
        ]);
        assertStrictEquals(ctx.cookies.get("access_token"), undefined);
        assertStrictEquals(ctx.cookies.get("refresh_token"), undefined);
    });
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

        assertStrictEquals(ctx.cookies.get("access_token"), undefined);
        assertStrictEquals(ctx.cookies.get("refresh_token"), undefined);
    });
});

// --- Database Query Tests ---
Deno.test("getIfExists returns user data if it exists", () => {
    const originalQuery = db.query;

    try {
        db.query = ((query: string, params?: any[]) => {
            if (query.startsWith("SELECT * FROM user WHERE email = ?")) {
                if (params?.[0] === "existing@example.com") {
                    return [[1, "Existing User", "existing@example.com", "hashedpassword", "", ""]];
                }
                return [];
            }

            if (query.startsWith("PRAGMA table_info(user)")) {
                return [
                    [0, "id"],
                    [1, "name"],
                    [2, "email"],
                    [3, "password"],
                    [4, "createdAt"],
                    [5, "image"],
                ];
            }

            return [];
        }) as typeof db.query;

        const user = getIfExists("user", "email", "existing@example.com");

        assertEquals(user, {
            id: 1,
            name: "Existing User",
            email: "existing@example.com",
            password: "hashedpassword",
            createdAt: "",
            image: "",
        });
    } finally {
        db.query = originalQuery;
    }
});

Deno.test("getIfExists returns null if user does not exist", () => {
    const originalQuery = db.query;

    try {
        db.query = ((query: string) => {
            if (query.startsWith("SELECT * FROM user WHERE email = ?")) {
                return [];
            }

            return [
                [0, "id"],
                [1, "name"],
                [2, "email"],
                [3, "password"],
                [4, "createdAt"],
                [5, "image"],
            ];
        }) as typeof db.query;

        const user = getIfExists("user", "email", "nonexistent@example.com");

        assertEquals(user, null);
    } finally {
        db.query = originalQuery;
    }
});
