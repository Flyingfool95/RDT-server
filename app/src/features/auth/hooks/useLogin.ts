export default function useAuth() {
    async function registerUser() {
        // Register logic
    }
    async function loginUser() {
        // Login logic
    }
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
