import { IUser } from "../../../../../shared/types/auth";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { loginSchema, registerSchema } from "../../../../../shared/zod/auth";
import { validateInputData } from "../../../../../shared/helpers/auth";

import useAuthStore from "../store/useAuthStore";
import useNotificationStore from "../../notifications/store/useNotificationStore";

export default function useAuth() {
    const { addNotification } = useNotificationStore((state) => state);
    const { setUser } = useAuthStore((state) => state);

    const navigate = useNavigate();

    const registerUser = useMutation({
        mutationFn: async ({
            email,
            password,
            confirmPassword,
        }: {
            email: string;
            password: string;
            confirmPassword: string;
        }) => {
            const result = validateInputData(registerSchema, { email, password, confirmPassword });

            const response = await fetch("http://localhost:8000/api/v1/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(result),
            });

            console.log(await response.json())

            if (response.status >= 400) {
                throw new Error(`Something went wrong. Error code: ${response.status}`);
            }

            addNotification({ message: "User registered", type: "success", duration: 5000 });

            return response.data;
        },
        onSuccess: (data: IUser) => {
            console.log(data);
            navigate("/login");
        },
        onError: (error) => {
            addNotification({ message: error.message, type: "error", duration: 7000 });
        },
    });

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
        //Clear httpcookie
        setUser(null);
        addNotification({ message: "Logged out", type: "info", duration: 5000 });
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
