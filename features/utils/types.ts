/* Helpers */
type NoFiles = Record<never, never>;
export type BodyWithNoFiles<T> = {
    data: T;
    files: NoFiles;
};
export type LoginData = {
    email: string;
    password: string;
};
export type RegisterData = {
    email: string;
    password: string;
    confirmPassword: string;
};
export type ResetPasswordData = {
    token: string;
    password: string;
};
export type ResetEmailData = {
    email: string;
};

export type TypeLoginBody = BodyWithNoFiles<LoginData>;
export type TypeRegisterBody = BodyWithNoFiles<RegisterData>;
export type TypeResetPasswordBody = BodyWithNoFiles<ResetPasswordData>;
export type TypeResetEmailBody = BodyWithNoFiles<ResetEmailData>;

/* Cookies  */
export type SetCookieOptions = {
    sameSite?: boolean | "none" | "strict" | "lax";
    path?: string;
    maxAge?: number;
    secure?: boolean;
    httpOnly?: boolean;
};
