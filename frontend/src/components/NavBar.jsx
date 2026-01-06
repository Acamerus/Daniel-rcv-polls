import React from "react";
import { Link } from "react-router-dom";
import "./NavBarStyles.css";

const NavBar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">🗳️ RCV Polls</Link>
      </div>

      <div className="nav-links">
        <div className="nav-center">
          <Link to="/" className="nav-link">
            Home
          </Link>
          {user && (
            <Link to="/create" className="nav-link">
              Create Poll
            </Link>
          )}
        </div>
        <div className="auth-links">
          {user ? (
            <>
              <span className="user-name">{user.username}</span>
              <button onClick={onLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
