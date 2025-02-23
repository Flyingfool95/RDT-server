import { useState } from "react";
import useAuth from "../hooks/useAuth";

export default function LoginForm() {
    const { loginUser } = useAuth();

    // State to store form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Call mutate with email & password from state
        loginUser.mutate({ email, password });
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email</label>
                <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input type="submit" value="Login" />
            </form>

            {loginUser.isPending && <h1>Loging in...</h1>}
        </>
    );
}
