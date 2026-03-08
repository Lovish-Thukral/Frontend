import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login({ setIsAuthenticated }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      alert("Enter username and password");
      return;
    }
    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_API_BASE_URL;
      const { data } = await axios.post(`${baseURL}/main/login`, { name, password });
      const user = data?.user;
      if (!user) { alert("Invalid server response"); return; }

      localStorage.setItem("nextep_auth", "true");
      localStorage.setItem("nextep_user", JSON.stringify(user));
      localStorage.setItem("user_id", user._id);
      localStorage.setItem("username", user.name);
      localStorage.setItem("skills", JSON.stringify(user.skills || []));
      if (user.roadmapHistory?.length) localStorage.setItem("roadmap", JSON.stringify(user.roadmapHistory[0]));
      if (user.RIASEC_vals) localStorage.setItem("riasec", JSON.stringify(user.RIASEC_vals));
      if (user.SIFA_vals) localStorage.setItem("sifa", JSON.stringify(user.SIFA_vals));
      if (user.chatHistory) localStorage.setItem("chatHistory", JSON.stringify(user.chatHistory));
      setIsAuthenticated(true);
      navigate("/");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background-color: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated grid background */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridShift 20s linear infinite;
        }

        @keyframes gridShift {
          0% { transform: translateY(0); }
          100% { transform: translateY(48px); }
        }

        /* Glow orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%);
          top: -100px; left: -100px;
          animation: float1 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%);
          bottom: -80px; right: -80px;
          animation: float2 10s ease-in-out infinite;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
          top: 50%; left: 60%;
          animation: float3 12s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -20px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 20px); }
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 48px 40px;
          backdrop-filter: blur(20px);
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* Corner accent */
        .login-card::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 80px; height: 80px;
          border-top: 2px solid rgba(99,102,241,0.8);
          border-left: 2px solid rgba(99,102,241,0.8);
          border-radius: 24px 0 0 0;
        }
        .login-card::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 80px; height: 80px;
          border-bottom: 2px solid rgba(168,85,247,0.6);
          border-right: 2px solid rgba(168,85,247,0.6);
          border-radius: 0 0 24px 0;
        }

        /* Logo/badge */
        .login-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          margin-bottom: 28px;
          animation: cardIn 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-badge-dot {
          width: 6px; height: 6px;
          background: #818cf8;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .login-badge-text {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #818cf8;
        }

        /* Heading */
        .login-heading {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1.1;
          margin-bottom: 8px;
          animation: cardIn 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-heading span {
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .login-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          animation: cardIn 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Fields */
        .field-wrap {
          margin-bottom: 16px;
          animation: cardIn 0.6s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .field-wrap:nth-child(2) { animation-delay: 0.3s; }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .field-wrap.focused .field-label { color: #818cf8; }

        .field-input-wrap {
          position: relative;
        }
        .field-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: #334155; }
        .field-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        /* Submit button */
        .login-btn {
          width: 100%;
          padding: 15px;
          margin-top: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          animation: cardIn 0.6s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.4);
        }
        .login-btn:hover:not(:disabled)::before { opacity: 1; }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 0;
          animation: cardIn 0.6s 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .login-divider-text {
          font-size: 12px;
          color: #334155;
        }
      `}</style>

      <div className="login-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="login-card">
          <div className="login-badge">
            <div className="login-badge-dot" />
            <span className="login-badge-text">Nextep AI</span>
          </div>

          <h1 className="login-heading">
            Welcome<br />
            <span>back.</span>
          </h1>
          <p className="login-sub">Sign in to continue your journey</p>

          <form onSubmit={handleLogin}>
            <div className={`field-wrap ${focused === "name" ? "focused" : ""}`}>
              <label className="field-label">Username</label>
              <div className="field-input-wrap">
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <div className={`field-wrap ${focused === "password" ? "focused" : ""}`}>
              <label className="field-label">Password</label>
              <div className="field-input-wrap">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">Your AI career guide awaits</span>
            <div className="login-divider-line" />
          </div>
        </div>
      </div>
    </>
  );
}