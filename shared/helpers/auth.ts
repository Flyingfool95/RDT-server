import { ZodSchema } from "zod";

export function validateInputData(schema: ZodSchema, data: unknown) {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new Error(`Validation errors: ${result.error.issues.map((err) => err.message).join(", ")}`);
    }

    return result.data;
}
