import { z } from "https://deno.land/x/zod@v3.24.2/mod.ts";

export const loginSchema = z
    .object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    })
    .strict();

export const registerSchema = loginSchema
    .extend({
        confirmPassword: z.string(),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirm-password"],
    });

export const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const sendResetEmailSchema = z.object({
    email: z.string().email("Invalid email format"),
});
