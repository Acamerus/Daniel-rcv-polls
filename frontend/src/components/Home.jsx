import React from "react";
import { Link } from "react-router-dom";
import "./HomeStyles.css";

const Home = () => {
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
            <p>Create polls with multiple options for voters to rank.</p>
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
            <p>Calculate fair results using the instant runoff voting algorithm.</p>
          </div>
        </div>

        <div className="cta-section">
          <Link to="/create" className="cta-button">
            ➕ Create Your First Poll
          </Link>
        </div>

        <div className="info-section">
          <h3>How It Works</h3>
          <ol>
            <li>Create a poll with a title and at least 2 options</li>
            <li>Share the generated link with voters</li>
            <li>Voters rank the options in order of preference</li>
            <li>Close the poll when voting is complete</li>
            <li>View the results calculated using instant runoff voting</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Home;
