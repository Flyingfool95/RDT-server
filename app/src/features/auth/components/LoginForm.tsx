import useAuth from "../hooks/useLogin";

export default function LoginForm() {
    const { loginUser } = useAuth();

    //Use useMutate from React Query here to login user onSubmit

    return <form onSubmit={() => console.log("Logging in user...")}></form>;
}
