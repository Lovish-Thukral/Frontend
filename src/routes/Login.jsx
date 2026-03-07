import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) return

    localStorage.setItem("nextep_auth", "true")
    setIsAuthenticated(true)
    navigate("/")
  }

  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600">

      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login to Nextep AI
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

        </form>
      </div>
    </div>
  )
}