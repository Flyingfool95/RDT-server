import { z } from "https://deno.land/x/zod@v3.24.2/mod.ts";
import { string } from "https://deno.land/x/zod@v3.24.2/types.ts";

export const updateUserSchema = z
    .object({
        email: z.string().email("Invalid email format").optional(),
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        currentPassword: z.string().min(8, "Incorrect current password").optional(),
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
                message: "New Password must be different from the old password",
                path: ["newPassword"],
            });
        }
    });

export const deleteProfileImageSchema = z.object({
    image: z.literal(""),
});
