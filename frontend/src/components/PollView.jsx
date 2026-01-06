import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../shared";

const PollView = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/polls/${id}`, {
          withCredentials: true,
        });
        setPoll(response.data.poll);
        setOptions(response.data.options);
        // Initialize ranking with all option IDs
        setRanking(response.data.options.map((o) => o.id));
        setLoading(false);
      } catch (err) {
        console.error("Fetch poll error:", err);
        setError("Failed to load poll");
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const moveOption = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === ranking.length - 1)
    ) {
      return;
    }

    const newRanking = [...ranking];
    const newIndex = index + direction;
    [newRanking[index], newRanking[newIndex]] = [
      newRanking[newIndex],
      newRanking[index],
    ];
    setRanking(newRanking);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/api/polls/${id}/vote`,
        { ranking },
        { withCredentials: true }
      );
      setSuccess("Your vote has been submitted!");
      // Reset form after short delay
      setTimeout(() => {
        setRanking([]);
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Submit vote error:", err);
      setError(err.response?.data?.error || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePoll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to close this poll and compute results?"
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/polls/${id}/close`,
        {},
        { withCredentials: true }
      );
      setResults(response.data.tally);
      setShowResults(true);
      setPoll({ ...poll, isOpen: false });
    } catch (err) {
      console.error("Close poll error:", err);
      setError("Failed to close poll: " + (err.response?.data?.error || ""));
    }
  };

  const getOptionText = (optionId) => {
    const option = options.find((o) => o.id === optionId);
    return option ? option.text : `Option ${optionId}`;
  };

  if (loading) {
    return <div style={styles.container}>Loading poll...</div>;
  }

  if (!poll) {
    return <div style={styles.container}>Poll not found</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>{poll.title}</h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        {showResults ? (
          <div style={styles.resultsSection}>
            <h3>Poll Results</h3>
            {results?.winner ? (
              <div>
                <p style={styles.resultText}>
                  🏆 <strong>{getOptionText(results.winner)}</strong> wins!
                </p>
                <details style={styles.details}>
                  <summary style={styles.summary}>View detailed rounds</summary>
                  <div style={styles.roundsContainer}>
                    {results.rounds?.map((round, idx) => (
                      <div key={idx} style={styles.round}>
                        <h4>Round {idx + 1}</h4>
                        {Object.entries(round.counts).map(([optId, count]) => (
                          <div key={optId}>
                            {getOptionText(Number(optId))}: {count} votes
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ) : results?.tie ? (
              <p style={styles.resultText}>
                🤝 Tie between:{" "}
                {results.tie.map((id) => getOptionText(id)).join(", ")}
              </p>
            ) : (
              <p style={styles.resultText}>No results yet</p>
            )}
          </div>
        ) : (
          <>
            {poll.isOpen && (
              <>
                <p style={styles.instructions}>
                  Rank the options by dragging or using the arrows. Your first
                  choice is your primary preference.
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.rankingContainer}>
                    <h4 style={styles.rankingTitle}>Your Ranking:</h4>
                    {ranking.map((optionId, index) => (
                      <div key={optionId} style={styles.rankingItem}>
                        <span style={styles.rankNumber}>{index + 1}.</span>
                        <span style={styles.optionText}>
                          {getOptionText(optionId)}
                        </span>
                        <div style={styles.buttonGroup}>
                          <button
                            type="button"
                            onClick={() => moveOption(index, -1)}
                            disabled={index === 0}
                            style={{
                              ...styles.moveBtn,
                              opacity: index === 0 ? 0.5 : 1,
                              cursor: index === 0 ? "not-allowed" : "pointer",
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOption(index, 1)}
                            disabled={index === ranking.length - 1}
                            style={{
                              ...styles.moveBtn,
                              opacity:
                                index === ranking.length - 1 ? 0.5 : 1,
                              cursor:
                                index === ranking.length - 1
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...styles.submitBtn,
                      opacity: submitting ? 0.6 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Submitting..." : "Submit Vote"}
                  </button>
                </form>

                <div style={styles.pollControls}>
                  <button
                    onClick={handleClosePoll}
                    style={styles.closePollBtn}
                  >
                    Close Poll & Calculate Results
                  </button>
                  <p style={styles.shareText}>
                    Share this URL with voters: {window.location.href}
                  </p>
                </div>
              </>
            )}
            {!poll.isOpen && !showResults && (
              <p style={styles.closedText}>This poll is closed.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "90vh",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    paddingTop: "30px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "30px",
    maxWidth: "600px",
    width: "100%",
  },
  heading: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#333",
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "#fee",
    border: "1px solid #fcc",
    color: "#c00",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  successBox: {
    backgroundColor: "#efe",
    border: "1px solid #cfc",
    color: "#0a0",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
  },
  instructions: {
    color: "#666",
    textAlign: "center",
    marginBottom: "20px",
    fontStyle: "italic",
  },
  form: {
    marginBottom: "20px",
  },
  rankingContainer: {
    marginBottom: "25px",
  },
  rankingTitle: {
    margin: "0 0 15px 0",
    color: "#555",
  },
  rankingItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    marginBottom: "10px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "4px",
    gap: "12px",
  },
  rankNumber: {
    fontWeight: "700",
    color: "#007bff",
    fontSize: "18px",
    minWidth: "30px",
  },
  optionText: {
    flex: 1,
    color: "#333",
  },
  buttonGroup: {
    display: "flex",
    gap: "5px",
  },
  moveBtn: {
    padding: "6px 10px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  pollControls: {
    borderTop: "1px solid #ddd",
    paddingTop: "20px",
    marginTop: "20px",
  },
  closePollBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "15px",
  },
  shareText: {
    fontSize: "12px",
    color: "#666",
    wordBreak: "break-all",
    backgroundColor: "#f9f9f9",
    padding: "10px",
    borderRadius: "4px",
    margin: 0,
  },
  closedText: {
    textAlign: "center",
    color: "#999",
    padding: "40px 20px",
  },
  resultsSection: {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "4px",
  },
  resultText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    margin: "10px 0",
  },
  details: {
    marginTop: "15px",
    cursor: "pointer",
  },
  summary: {
    fontWeight: "600",
    color: "#007bff",
    padding: "10px",
    backgroundColor: "#f0f8ff",
    borderRadius: "4px",
  },
  roundsContainer: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  round: {
    padding: "10px",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
};

export default PollView;
