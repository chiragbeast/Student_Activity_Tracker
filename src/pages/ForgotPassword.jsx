import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>

        <input className="auth-input" placeholder="Enter your email" />

        <button className="auth-btn">
          Send Reset Link
        </button>

        <div className="auth-link">
          <a onClick={() => navigate("/")}>
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}