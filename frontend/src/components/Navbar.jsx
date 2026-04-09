import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import axios from "axios";
import { useEffect } from "react";

const NAV_LINKS = [
  { to: "/home", label: "Home" },
  { to: "/pdashboard", label: "Packets" },
];

function LogoutIcon() {
  return (
    <svg
      className="navbar__logout-icon"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M10.5 11L13.5 8l-3-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 8H6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavBar({ currUser, token, setToken }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = !!token;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const goToLogin = () => navigate("/login");
  const goToReg = () => navigate("/register");

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <Link to="/home">
          <span className="navbar__logo-dot" />
        </Link>
      </div>

      <ul className="navbar__links">
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className={location.pathname === to ? "active" : ""}>
              {label}
            </Link>
          </li>
        ))}
        {isLogin && (
          <li>
            <Link
              to={currUser?.role === "admin" ? "/historyadmin" : "/history"}
              className={
                location.pathname.startsWith("/history") ? "active" : ""
              }
            >
              History
            </Link>
          </li>
        )}
        {isLogin && currUser?.role === "admin" && (
          <li>
            <Link
              to="/dashboard"
              className={
                location.pathname.startsWith("/dashboard") ? "active" : ""
              }
            >
              Dashboard
            </Link>
          </li>
        )}
        {isLogin && (
          <li>
            <Link
              to={currUser?.role === "admin" ? "/Encryptionadmin" : "/Encryption"}
              className={
                location.pathname.startsWith("/Encryption") ? "active" : ""
              }
            >
              Encryption
            </Link>
          </li>
        )}
      </ul>


      <div className="navbar__right">
        {!isLogin ? (
          <>
            <button className="navbar__logout" onClick={goToLogin}>
              Login
            </button>
            <button className="navbar__logout" onClick={goToReg}>
              Register
            </button>
          </>
        ) : (
          <>
            <span style={{ marginRight: 10 }}>{currUser?.username}</span>
            <button className="navbar__logout" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
