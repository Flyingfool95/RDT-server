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
            console.log("Logging in with data:", result);
            
            //Send data to login endpoint of server
        },
        onSuccess: () => {
            console.log("Success...");
            //Set user to user data
            //Redirect to dashboard
        },
        onError: (error) => {
            console.error("Logging failed. ", error.message);
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
