export type SanitizeInput = string | SanitizeInput[] | { [key: string]: SanitizeInput };

export type ApiError = { message: string; path?: string };

export type ApiResponse<T> = {
    success: boolean;
    status: number;
    message?: string;
    data?: T;
    errors?: Array<ApiError>;
};
