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
    .refine((data) => data.password === data.confirmPassword, "Passwords do not match");

export const userSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    password: z.string().optional(),
});

export const updateUserSchema = z
    .object({
        email: z.string().email("Invalid email format").optional(),
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        currentPassword: z.string().min(8, "Current password must be your current password").optional(),
        newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
    })
    .superRefine((data, ctx) => {
        if ((data.newPassword && !data.currentPassword) || (!data.newPassword && data.currentPassword)) {
            ctx.addIssue({
                code: "custom",
                message: "Both Current Password and New Password must be provided together",
                path: ["currentPassword"],
            });
        }

        if (data.newPassword && data.currentPassword && data.newPassword === data.currentPassword) {
            ctx.addIssue({
                code: "custom",
                message: "New Password must be different from the current password",
                path: ["newPassword"],
            });
        }
    });
