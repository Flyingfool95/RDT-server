import { Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./routes/auth/Login";
import NotificationList from "./features/notifications/components/NotificationList";

function App() {
    return (
        <>
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
            <NotificationList />
        </>
    );
}

export default App;
