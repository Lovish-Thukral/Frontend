import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

export default function Login({ setIsAuthenticated }) {

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!name || !password) {
      alert("Please enter username and password")
      return
    }

    try {
      setLoading(true)

      const baseURL = import.meta.env.VITE_API_BASE_URL
      console.log("API URL:", baseURL)

      const response = await axios.post(
        `${baseURL}/main/login`,
        { name, password }
      )

      console.log("Login response:", response.data)

      const user = response?.data?.user

      if (!user) {
        alert("Invalid server response")
        return
      }

      localStorage.setItem("username", user.name)
      localStorage.setItem("userID", user._id)
      localStorage.setItem("RIASEC_vals", JSON.stringify(user.RIASEC_values || {}))
      localStorage.setItem("SFIA_vals", JSON.stringify(user.SFIA_values || {}))
      localStorage.setItem("chat_history", JSON.stringify(user.chatHistory || []))

      setIsAuthenticated(true)

      navigate("/")

    } catch (error) {

      console.error("Login error:", error)

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed"

      alert(message)

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600">

      <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md">

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Login to Nextep AI
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  )
}