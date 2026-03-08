import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Chat from "./chat";
import Levels from "./levels";
import Login from "./routes/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem("nextep_auth");
    const savedUser = localStorage.getItem("nextep_user");

    if (savedAuth === "true" && savedUser) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <Routes>

      {/* LOGIN ROUTE */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} />
          )
        }
      />

      {/* CHAT HOME ROUTE */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Chat setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ✅ LEVELS ROUTE ADDED */}
     <Route
        path="/levels/"
        element={
          isAuthenticated ? (
            <Levels />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      {/* Optional fallback route */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default App;