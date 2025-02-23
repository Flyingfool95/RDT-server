import { NavLink, Outlet } from "react-router-dom";
import "../style/AppNavigation.css";
import useAuth from "../../auth/hooks/useAuth";

export default function AppNavigation() {
    const { logoutUser } = useAuth();

    return (
        <>
            <nav>
                <NavLink to={"/"}>Dashboard</NavLink>
                <NavLink to={"/profile"}>Profile</NavLink>
                <button onClick={logoutUser}>Logout</button>
            </nav>
            <Outlet />
        </>
    );
}
