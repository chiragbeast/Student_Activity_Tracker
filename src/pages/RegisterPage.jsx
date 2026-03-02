import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>

        <input className="auth-input" placeholder="Full Name" />
        <input className="auth-input" placeholder="Email" />
        <input className="auth-input" type="password" placeholder="Password" />

        <button className="auth-btn">Register</button>

        <div className="auth-link">
          Already have an account?{" "}
          <a onClick={() => navigate("/")}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
}