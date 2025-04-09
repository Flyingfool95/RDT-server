import { assertEquals, assert } from "jsr:@std/assert";
import { generateJWT, verifyJWT } from "../features/utils/jwt.ts";

Deno.test("generate and verify valid JWT", async () => {
    const payload = { foo: "bar", sub: 123 };
    const token = await generateJWT(payload, 3600);
    const verifiedPayload = await verifyJWT(token);
    assert(verifiedPayload, "Valid token should be verified successfully");
    assertEquals(verifiedPayload?.foo, "bar");
    assertEquals(verifiedPayload?.sub, 123);
});

Deno.test("verifyJWT returns null for expired token", async () => {
    const payload = { foo: "bar" };
    const token = await generateJWT(payload, 0);
    const verifiedPayload = await verifyJWT(token);
    assertEquals(verifiedPayload, null, "Expired token should return null on verification");
});

Deno.test("verifyJWT returns null for an invalid token", async () => {
    const invalidToken = "this.is.an.invalid.token";
    const verifiedPayload = await verifyJWT(invalidToken);
    assertEquals(verifiedPayload, null, "Invalid token format should return null on verification");
});

Deno.test("generateJWT produces a token with 3 parts", async () => {
    const payload = { foo: "bar" };
    const token = await generateJWT(payload, 3600);
    const parts = token.split(".");
    assertEquals(parts.length, 3, "Token should have 3 parts");
});

Deno.test("verifyJWT returns null for a tampered token", async () => {
    const payload = { foo: "bar" };
    const token = await generateJWT(payload, 3600);
    const parts = token.split(".");
    parts[2] = parts[2]
        .split("")
        .map((char, index) => (index === 0 ? (char === "A" ? "B" : "A") : char))
        .join("");
    const tamperedToken = parts.join(".");
    const verifiedPayload = await verifyJWT(tamperedToken);
    assertEquals(verifiedPayload, null, "Tampered token should return null on verification");
});
