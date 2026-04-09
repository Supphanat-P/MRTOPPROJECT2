import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

function Login({ setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/users/login", { username, password });
      const token = res.data.token;

      setToken(token);

      localStorage.setItem("token", token);

      navigate("/home");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // ใช้ข้อความจาก server
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">
          Sign in to your account to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-card__field">
            <label className="auth-card__label">username</label>
            <input
              className="auth-card__input"
              type="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label">Password</label>
            <input
              className="auth-card__input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-card__btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && <p className="auth-card__error">{error}</p>}

        <p className="auth-card__footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
