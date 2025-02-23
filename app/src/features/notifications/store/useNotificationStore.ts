import { create } from "zustand";
import { INotificationStore, INewNotification } from "../../../../../shared/types/notifications";

const useNotificationStore = create<INotificationStore>((set, get) => ({
    notifications: [],

    addNotification: ({ message, type = "info", duration = 5000 }: INewNotification) => {
        const id = new Date().getTime();
        set((state) => ({
            notifications: [...state.notifications, { id, message, type, duration }],
        }));

        setTimeout(() => {
            get().removeNotification(id);
        }, duration);
    },

    removeNotification: (id: number) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },
}));

export default useNotificationStore;
