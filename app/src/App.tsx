import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import RouteGuard from "./features/auth/components/RouteGuard";
import NotificationList from "./features/notifications/components/NotificationList";

import Login from "./routes/auth/Login";

const Dashboard = lazy(() => import("./routes/protected/Dashboard"));

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
                    <Route path="/" element={<Dashboard />} />
                </Route>
            </Routes>
            <NotificationList />
        </>
    );
}

export default App;
