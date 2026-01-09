import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";

const PollCreate = ({ user }) => {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const addOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    setOptions((prev) =>
      prev.map((option, i) => (i === index ? value : option))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Filter out empty options
      const cleanedOptions = options
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      if (!title.trim()) {
        setError("Poll title is required");
        setLoading(false);
        return;
      }

      if (cleanedOptions.length < 2) {
        setError("At least 2 options are required");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/polls`,
        {
          title: title.trim(),
          options: cleanedOptions,
        },
        { withCredentials: true }
      );

      // Redirect to the poll view page
      navigate(`/poll/${response.data.poll.id}`);
    } catch (err) {
      console.error("Create poll error:", err);
      setError(
        err.response?.data?.error || "Failed to create poll. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.heading}>Create a New Poll</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="title" style={styles.label}>
              Poll Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should voters decide on?"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Options *</label>
            {options.map((option, index) => (
              <div key={index} style={styles.optionRow}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={styles.input}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    style={styles.removeBtn}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOption}
            style={styles.secondaryBtn}
          >
            + Add Option
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Create Poll"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
    backgroundColor: "#f5f5f5",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
  },
  heading: {
    marginTop: 0,
    marginBottom: "30px",
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
  formGroup: {
    marginBottom: "25px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  optionRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
  },
  removeBtn: {
    padding: "8px 12px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
};

export default PollCreate;
