export interface INotification {
    id: number;
    message: string;
    type: "info" | "error" | "warning" | "success";
    duration: number;
}
export interface INewNotification {
    message: string;
    type?: "info" | "error" | "warning" | "success";
    duration?: number;
}

export interface INotificationStore {
    notifications: INotification[];
    addNotification: (newNotification: INewNotification) => void;
    removeNotification: (id: number) => void;
}
