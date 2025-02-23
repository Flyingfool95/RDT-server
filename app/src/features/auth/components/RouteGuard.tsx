import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { Suspense } from "react";

export default function RouteGuard({ isProtected }: { isProtected: boolean }) {
    const location = useLocation();
    const { user } = useAuthStore((state) => state);

    if (isProtected && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isProtected && user) {
        return <Navigate to="/" replace />;
    }

    return (
        <Suspense fallback={<h1>Loading....</h1> /* Add loading spinner */}>
            <Outlet />
        </Suspense>
    );
}
