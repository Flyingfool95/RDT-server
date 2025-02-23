export interface IUser {
    id: string;
    email: string;
    roles: string[];
}
export interface IAuthStore {
    user: IUser | null;
    setUser: (newUser: IUser) => void;
}
