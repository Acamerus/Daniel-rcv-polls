const express = require("express");
const router = express.Router();
const { Poll, Option, Ballot, VoteToken } = require("../database");
const { emitPollEvent } = require("../socket-server");

/**
 * Instant Runoff Voting (IRV) algorithm
 * Eliminates candidates with fewest votes until a majority winner is found
 */
const performInstantRunoffVoting = (optionIds, ballots) => {
  let remaining = [...optionIds];
  const rounds = [];

  while (remaining.length > 1) {
    // Count first-preference votes among remaining candidates
    const counts = Object.fromEntries(remaining.map((id) => [id, 0]));
    for (const ballot of ballots) {
      const firstPreference = ballot.find((id) => remaining.includes(id));
      if (firstPreference) {
        counts[firstPreference]++;
      }
    }

    const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

    // Check for majority winner
    for (const id of remaining) {
      if (totalVotes > 0 && counts[id] > totalVotes / 2) {
        return {
          winner: id,
          rounds: [...rounds, { remaining, counts }],
        };
      }
    }

    // Record this round
    rounds.push({ remaining: [...remaining], counts: { ...counts } });

    // Eliminate candidate(s) with lowest votes
    const minCount = Math.min(...Object.values(counts));
    const toEliminate = remaining.filter((id) => counts[id] === minCount);

    // Handle tie: if all remaining have same votes, they're all tied
    if (toEliminate.length === remaining.length) {
      return {
        tie: remaining,
        rounds,
      };
    }

    // Remove eliminated candidates
    remaining = remaining.filter((id) => !toEliminate.includes(id));
  }

  // If only one candidate remains, they win
  if (remaining.length === 1) {
    return {
      winner: remaining[0],
      rounds,
    };
  }

  return {
    error: "No winner determined",
    rounds,
  };
};

// POST /api/polls - Create a new poll with options
router.post("/", async (req, res) => {
  try {
    const { title, options = [] } = req.body;
    const creatorId = req.user?.id || null;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Poll title is required" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: "At least 2 options are required",
      });
    }

    const cleanedOptions = options
      .map((o) => (typeof o === "string" ? o.trim() : String(o).trim()))
      .filter((o) => o.length > 0);

    if (cleanedOptions.length < 2) {
      return res.status(400).json({
        error: "At least 2 valid options are required",
      });
    }

    const poll = await Poll.create({
      title: title.trim(),
      creatorId,
    });

    const optionInstances = await Promise.all(
      cleanedOptions.map((text) =>
        Option.create({ text, pollId: poll.id })
      )
    );

    res.json({
      poll,
      options: optionInstances,
    });
  } catch (err) {
    console.error("Create poll error:", err);
    res.status(500).json({ error: "Failed to create poll" });
  }
});

// GET /api/polls/:id - Get a poll with its options
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const options = await Option.findAll({
      where: { pollId: poll.id },
    });

    const ballots = await Ballot.findAll({
      where: { pollId: poll.id },
    });

    res.json({ poll, options, ballotCount: ballots.length });
  } catch (err) {
    console.error("Get poll error:", err);
    res.status(500).json({ error: "Failed to get poll" });
  }
});

// POST /api/polls/:id/vote - Submit a ranked ballot
router.post("/:id/vote", async (req, res) => {
  try {
    const { ranking, voterToken } = req.body;

    if (!Array.isArray(ranking) || ranking.length === 0) {
      return res.status(400).json({
        error: "Ranking array of option IDs is required",
      });
    }

    if (!voterToken) {
      return res.status(400).json({
        error: "Voter token is required",
      });
    }

    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.isOpen) {
      return res.status(400).json({ error: "Poll is closed" });
    }

    // Check if this voter has already voted in this poll
    const existingVote = await VoteToken.findOne({
      where: {
        pollId: poll.id,
        token: voterToken,
      },
    });

    if (existingVote) {
      return res.status(400).json({
        error: "You have already voted in this poll",
        alreadyVoted: true,
      });
    }

    // Validate that all ranking IDs are valid options for this poll
    const options = await Option.findAll({
      where: { pollId: poll.id },
    });
    const validIds = options.map((o) => o.id);
    const invalidIds = ranking.filter((id) => !validIds.includes(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: "Invalid option IDs in ranking",
        invalidIds,
      });
    }

    // Create ballot and vote token
    await Ballot.create({
      pollId: poll.id,
      ranking,
    });

    await VoteToken.create({
      pollId: poll.id,
      token: voterToken,
    });

    // Get updated ballot count and current tally
    const ballots = await Ballot.findAll({
      where: { pollId: poll.id },
    });
    const ballotsData = ballots.map((b) => b.ranking);
    const optionIds = options.map((o) => o.id);
    const currentTally = performInstantRunoffVoting(optionIds, ballotsData);

    // Emit live update to all users watching this poll
    emitPollEvent(poll.id, "new-vote", {
      totalVotes: ballots.length,
      currentTally,
      timestamp: new Date(),
    });

    res.json({ message: "Ballot submitted successfully" });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Failed to submit ballot" });
  }
});

// POST /api/polls/:id/close - Close poll and compute IRV results (creator only)
router.post("/:id/close", async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Verify creator ownership
    const userId = req.user?.id;
    if (!userId || poll.creatorId !== userId) {
      return res.status(403).json({
        error: "Only the poll creator can close this poll",
      });
    }

    poll.isOpen = false;
    await poll.save();

    const options = await Option.findAll({
      where: { pollId: poll.id },
    });
    const ballots = await Ballot.findAll({
      where: { pollId: poll.id },
    });

    const optionIds = options.map((o) => o.id);
    const ballotsData = ballots.map((b) => b.ranking);

    const result = performInstantRunoffVoting(optionIds, ballotsData);

    res.json({
      poll,
      options,
      tally: result,
    });
  } catch (err) {
    console.error("Close poll error:", err);
    res.status(500).json({ error: "Failed to close poll" });
  }
});

module.exports = router;
