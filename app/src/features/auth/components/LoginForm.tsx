import useAuth from "../hooks/useAuth";

export default function LoginForm() {
    const { loginUser } = useAuth();

    if (loginUser.isPending) {
        return <div>Loading...</div>;
    }

    return (
        <form onSubmit={loginUser.mutate}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" />

            <label htmlFor="password">Password</label>
            <input type="password" name="password" id="password" />

            <input type="submit" value="Login" />
        </form>
    );
}
