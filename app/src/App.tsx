import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import RouteGuard from "./features/auth/components/RouteGuard";
import NotificationList from "./features/notifications/components/NotificationList";

import Login from "./routes/auth/Login";
import AppNavigation from "./features/app-navigation/components/AppNavigation";

const Dashboard = lazy(() => import("./routes/protected/Dashboard"));
const Profile = lazy(() => import("./routes/protected/Profile"));

function App() {
    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route element={<RouteGuard isProtected={false} />}>
                    <Route path="/login" element={<Login />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<RouteGuard isProtected={true} />}>
                    <Route element={<AppNavigation />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                </Route>
            </Routes>
            <NotificationList />
        </>
    );
}

export default App;
