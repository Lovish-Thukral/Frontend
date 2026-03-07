import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Chat from "./chat"
import Login from "./routes/Login"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const savedAuth = localStorage.getItem("nextep_auth")
    setIsAuthenticated(savedAuth === "true")
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    )
  }

  return (
    <Routes>
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
    </Routes>
  )
}

export default App