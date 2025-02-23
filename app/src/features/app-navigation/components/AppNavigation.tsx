import { NavLink, Outlet } from "react-router-dom";

export default function AppNavigation() {
    return (
        <>
            <nav>
                <NavLink to={"/"}>Dashboard</NavLink>
                <NavLink to={"/profile"}>Profile</NavLink>
            </nav>
            <Outlet />
        </>
    );
}
