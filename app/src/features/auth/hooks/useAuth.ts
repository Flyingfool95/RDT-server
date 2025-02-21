import { useMutation } from "@tanstack/react-query";
import { loginSchema } from "../../../../../shared/zod/auth";
import { validateInputData } from "../../../../../shared/helpers/auth";

export default function useAuth() {
    async function registerUser() {
        // Register logic
    }

    const loginUser = useMutation({
        mutationFn: async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const result = validateInputData(loginSchema, {
                email: formData.get("email"),
                password: formData.get("password"),
            });

            /*  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/login`, {
                method: "POST",
                body: JSON.stringify(result),
            }); */
            /* Temp respons until API is built */
            const response = {
                status: 200,
                data: "Success",
            };

            if (response.status >= 400) {
                throw new Error(`Something went wrong. Error code: ${response.status}`);
            }

            return response;
        },
        onSuccess: (data) => {
            console.log(data);
            //Set user to user data
            //Redirect to dashboard
        },
        onError: (error) => {
            console.error("Login failed. ", error.message);
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
