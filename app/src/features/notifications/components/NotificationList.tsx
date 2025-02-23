import "../styles/notifications.css";
import { INotificationStore } from "../../../../../shared/types/notifications";
import useNotificationStore from "../store/useNotificationStore";

export default function NotificationList() {
    const { notifications, removeNotification } = useNotificationStore((state: INotificationStore) => state);

    return (
        <div className="notification-container">
            {notifications.map(({ id, message, type }) => (
                <div key={id} className={`notification ${type}`}>
                    <p>{message}</p>
                    <button onClick={() => removeNotification(id)}></button>
                </div>
            ))}
        </div>
    );
}
