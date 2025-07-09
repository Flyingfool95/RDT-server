/* Helpers */
type NoFiles = Record<never, never>;
export type BodyWithNoFiles<T> = {
    data: T;
    files: NoFiles;
};
export type LoginData = BodyWithNoFiles<{
    email: string;
    password: string;
}>;
export type RegisterData = BodyWithNoFiles<{
    email: string;
    password: string;
    confirmPassword: string;
}>;
export type ResetPasswordData = BodyWithNoFiles<{
    token: string;
    password: string;
}>;
export type ResetEmailData = BodyWithNoFiles<{
    email: string;
}>;

/* Cookies  */
export type SetCookieOptions = {
    sameSite?: boolean | "none" | "strict" | "lax";
    path?: string;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
};
