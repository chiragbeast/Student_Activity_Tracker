import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const ROLES = ["Student", "Faculty", "Admin"];

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("Student");

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>

        <div style={{ display: "flex", marginBottom: "20px" }}>
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              style={{
                flex: 1,
                padding: "10px",
                background:
                  activeRole === role ? "#FFFFFF" : "#F1F1F1",
                border: "none",
                cursor: "pointer",
                fontWeight: activeRole === role ? "600" : "500"
              }}
            >
              {role}
            </button>
          ))}
        </div>

        <input className="auth-input" placeholder="ID / Email" />
        <input className="auth-input" type="password" placeholder="Password" />

        <button className="auth-btn">Login</button>

        <div className="auth-link">
          <a onClick={() => navigate("/forgot-password")}>
            Forgot Password?
          </a>
        </div>

        <div className="auth-link">
          Don't have an account?{" "}
          <a onClick={() => navigate("/register")}>
            Register
          </a>
        </div>
      </div>
    </div>
  );
}