import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Analyze from "./pages/Analyze";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Maps from "./pages/Maps";
import Trends from "./pages/Trends";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/analyze" element={<Analyze />} />

        <Route path="/analyze" element={<Analyze />} />

        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Navigate to="alerts" replace />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="maps" element={<Maps />} />
          <Route path="trends" element={<Trends />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
