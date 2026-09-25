import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Signup from "../components/signup";
import Login from "../components/login";
import Home from "../components/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ChatProvider } from "./context/ChatContext";

function MainContent() {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0c101b",
            color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px)",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={authUser ? <Home /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={
            authUser ? (
              <Navigate to="/" replace />
            ) : (
              <Login onSwitchToSignup={() => navigate("/signup")} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            authUser ? (
              <Navigate to="/" replace />
            ) : (
              <Signup onSwitchToLogin={() => navigate("/login")} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <MainContent />
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
