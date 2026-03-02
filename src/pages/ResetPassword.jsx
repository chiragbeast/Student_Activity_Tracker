import "./Auth.css";

export default function ResetPassword() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>

        <input className="auth-input" type="password" placeholder="New Password" />
        <input className="auth-input" type="password" placeholder="Confirm Password" />

        <button className="auth-btn">
          Reset Password
        </button>
      </div>
    </div>
  );
}