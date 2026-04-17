import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { useThemeMode } from "./hooks/useThemeMode";
import "./index.css";

const AppBootstrap = () => {
  useThemeMode();

  return (
    <>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            border: "1px solid #d4d4d4",
            background: "#ffffff",
            color: "#171717",
          },
        }}
      />
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppBootstrap />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
