import { create } from "zustand";
import { IAuthStore, IUser } from "../../../../../shared/types/auth";

const useAuthStore = create<IAuthStore>((set, get) => ({
    user: null,
    setUser: (newUser: IUser) => {
        set(() => ({
            user: newUser,
        }));
    },
}));

export default useAuthStore;
