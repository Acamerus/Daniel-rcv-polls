import React from "react";
import { Link } from "react-router-dom";
import "./HomeStyles.css";

const Home = ({ user }) => {
  return (
    <div className="home">
      <h1>Welcome to Ranked Choice Voting Polls</h1>
      <div className="home-content">
        <p className="tagline">
          Create polls with ranked choice voting and share them with others.
        </p>

        <div className="features">
          <div className="feature">
            <h3>📋 Create Polls</h3>
            <p>{user ? "Create polls with multiple options for voters to rank." : "Create polls (login required)"}</p>
          </div>
          <div className="feature">
            <h3>🔗 Share Links</h3>
            <p>Generate shareable links to get votes from others.</p>
          </div>
          <div className="feature">
            <h3>🗳️ Ranked Voting</h3>
            <p>Voters rank options by preference using instant runoff voting.</p>
          </div>
          <div className="feature">
            <h3>📊 Instant Results</h3>
            <p>{user ? "Calculate fair results using the instant runoff voting algorithm." : "Results available to poll creators only"}</p>
          </div>
        </div>

        <div className="cta-section">
          {user ? (
            <Link to="/create" className="cta-button">
              ➕ Create Your First Poll
            </Link>
          ) : (
            <Link to="/login" className="cta-button">
              🔐 Login to Create Polls
            </Link>
          )}
        </div>

        <div className="info-section">
          <h3>How It Works</h3>
          <ol>
            <li>
              {user ? (
                <>Login or create an account to start</>
              ) : (
                <>Login to create polls</>
              )}
            </li>
            <li>Create a poll with a title and at least 2 options</li>
            <li>Share the generated link with voters</li>
            <li>Voters rank the options in order of preference</li>
            <li>Close the poll when voting is complete</li>
            <li>View the results calculated using instant runoff voting</li>
          </ol>
        </div>

        {!user && (
          <div style={styles.authPrompt}>
            <h3>Want to Create a Poll?</h3>
            <p>You need to be logged in to create polls. But you can still vote on shared polls!</p>
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.link}>Login</Link>
              <span style={styles.separator}>or</span>
              <Link to="/signup" style={styles.link}>Sign Up</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  authPrompt: {
    marginTop: "40px",
    padding: "20px",
    backgroundColor: "#f0f8ff",
    border: "2px solid #007bff",
    borderRadius: "8px",
    textAlign: "center",
  },
  authLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "15px",
  },
  link: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    textDecoration: "none",
    borderRadius: "4px",
    fontWeight: "600",
  },
  separator: {
    color: "#666",
    fontWeight: "600",
  },
};

export default Home;
