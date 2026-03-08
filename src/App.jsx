import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Chat from "./chat";
import Levels from "./levels";
import Login from "./routes/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const refreshUser = async (userID) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${baseURL}/main/RefreshUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID }),  // ✅ was { name: username }
      });

      if (!res.ok) throw new Error("Failed to refresh user");

      const data = await res.json();
      const user = data?.user;

      if (!user) throw new Error("No user in response");

      // Sync all localStorage keys with latest from server
      localStorage.setItem("nextep_user", JSON.stringify(user));
      localStorage.setItem("user_id", user._id);
      localStorage.setItem("username", user.name);

      if (user.roadmapHistory?.length)
        localStorage.setItem("roadmap", JSON.stringify(user.roadmapHistory[0]));

      if (user.RIASEC_vals)
        localStorage.setItem("riasec", JSON.stringify(user.RIASEC_vals));

      if (user.SIFA_vals)
        localStorage.setItem("sifa", JSON.stringify(user.SIFA_vals));

      if (user.chatHistory)
        localStorage.setItem("chatHistory", JSON.stringify(user.chatHistory));

    } catch (err) {
      console.error("RefreshUser failed:", err);
      // Don't log out — just use stale localStorage data silently
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem("nextep_auth");
    const savedUserID = localStorage.getItem("user_id");  // ✅ renamed for clarity

    if (savedAuth === "true" && savedUserID) {
      setIsAuthenticated(true);
      refreshUser(savedUserID);  // ✅ passing the actual _id
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080810",
          gap: 16,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
          .loader-ring {
            width: 36px; height: 36px;
            border: 2px solid rgba(99,102,241,0.15);
            border-top-color: #818cf8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loader-text {
            font-family: 'Syne', sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.1em;
            background: linear-gradient(135deg, #818cf8, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>
        <div className="loader-ring" />
        <span className="loader-text">NEXTEP AI</span>
      </div>
    );
  }

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/" replace />
            : <Login setIsAuthenticated={setIsAuthenticated} />
        }
      />

      {/* CHAT HOME */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Chat setIsAuthenticated={setIsAuthenticated} />
            : <Navigate to="/login" replace />
        }
      />

      {/* LEVELS */}
      <Route
        path="/levels"
        element={
          isAuthenticated
            ? <Levels />
            : <Navigate to="/login" replace />
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;