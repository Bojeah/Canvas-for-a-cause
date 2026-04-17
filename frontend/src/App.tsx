import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import NetworkStatusBanner from "./components/NetworkStatusBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { useAuth } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArtworkCreate from "./pages/AdminArtworkCreate";
import AdminArtworkEdit from "./pages/AdminArtworkEdit";
import AdminLogin from "./pages/AdminLogin";
import ArtworkDetail from "./pages/ArtworkDetail";
import Artworks from "./pages/Artworks";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-(--background)">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <NetworkStatusBanner />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/artworks"
            element={
              <ProtectedRoute>
                <Artworks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artworks/:id"
            element={
              <ProtectedRoute>
                <ArtworkDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/artworks/new"
            element={
              <AdminRoute>
                <AdminArtworkCreate />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/artworks/:id/edit"
            element={
              <AdminRoute>
                <AdminArtworkEdit />
              </AdminRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/artworks" : "/"} replace />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
