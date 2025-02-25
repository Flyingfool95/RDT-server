// Conditionally import Zod based on the runtime environment
const z =
    typeof Deno !== "undefined"
        ? await import("https://deno.land/x/zod@v3.23.8/mod.ts").then((mod) => mod.z)
        : await import("zod").then((mod) => mod.z);

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
        path: ["confirmPassword"],
    });
