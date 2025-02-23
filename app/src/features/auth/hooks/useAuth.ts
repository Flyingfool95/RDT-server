import { useMutation } from "@tanstack/react-query";
import { loginSchema } from "../../../../../shared/zod/auth";
import { validateInputData } from "../../../../../shared/helpers/auth";
import useNotificationStore from "../../notifications/store/useNotificationStore";
import { IUser } from "../../../../../shared/types/auth";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function useAuth() {
    const { addNotification } = useNotificationStore((state) => state);
    const { setUser } = useAuthStore((state) => state);

    const navigate = useNavigate();

    async function registerUser() {
        // Register logic
    }

    const loginUser = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const result = validateInputData(loginSchema, { email, password });

            /* Simulated API response */
            const response = {
                status: 200,
                data: {
                    id: "123abc",
                    email: "johannes@hernehult.com",
                    roles: ["admin"],
                },
            };

            if (response.status >= 400) {
                throw new Error(`Something went wrong. Error code: ${response.status}`);
            }

            addNotification({ message: "Logged in", type: "success", duration: 5000 });

            return response.data;
        },
        onSuccess: (data: IUser) => {
            console.log(data);
            // Set user to user data
            setUser(data);
            // Redirect to dashboard

            navigate("/");
        },
        onError: (error) => {
            addNotification({ message: error.message, type: "error", duration: 7000 });
        },
    });

    async function updateUser() {
        // Update logic
    }
    async function logoutUser() {
        // Logout logic
    }
    async function deleteUser() {
        // Delete user
    }

    return {
        registerUser,
        loginUser,
        updateUser,
        logoutUser,
        deleteUser,
    };
}
