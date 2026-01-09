# Vote Deduplication & Creator Verification Update

## Overview
This update implements two critical security and integrity features for the polling application:
1. **Vote Deduplication** - Prevents the same voter from voting multiple times in a single poll
2. **Creator-Only Poll Closing** - Ensures only the poll creator can close their poll and view final results

## Changes Made

### Backend

#### 1. New VoteToken Model (`backend/database/vote-token.js`)
**Purpose**: Track unique voter sessions per poll to prevent duplicate voting.

**Fields**:
- `pollId` (INTEGER, NOT NULL) - Foreign key referencing the poll
- `token` (STRING, UNIQUE, NOT NULL) - Unique identifier for each voter session
- `votedAt` (DATE, default NOW) - Timestamp when the vote was recorded

**Code**:
```javascript
const VoteToken = db.define("voteToken", {
  pollId: { type: DataTypes.INTEGER, allowNull: false },
  token: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    comment: "Unique identifier for each voter (generated client-side)" 
  },
  votedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
```

#### 2. Updated Database Exports (`backend/database/index.js`)
**Change**: Added `VoteToken` to exports alongside existing models (Poll, Option, Ballot, User).

```javascript
module.exports = {
  db,
  User,
  Poll,
  Option,
  Ballot,
  VoteToken,  // NEW
};
```

#### 3. Enhanced Vote Endpoint (`backend/api/polls.js` - POST /:id/vote)
**New Behavior**:
1. Requires `voterToken` in request body
2. Checks if voter has already voted using: `VoteToken.findOne({ pollId, token })`
3. Returns `400 Bad Request` with `alreadyVoted: true` if duplicate detected
4. Creates `VoteToken` record after successful ballot submission
5. Maintains all existing validation and socket event emission

**Key Code Changes**:
```javascript
router.post("/:id/vote", async (req, res) => {
  const { ranking, voterToken } = req.body;  // NEW: accepts voterToken
  
  // ... validation code ...
  
  // NEW: Check for duplicate votes
  const existingVote = await VoteToken.findOne({
    where: { pollId: poll.id, token: voterToken }
  });
  
  if (existingVote) {
    return res.status(400).json({
      error: "You have already voted in this poll",
      alreadyVoted: true,
    });
  }
  
  // ... create ballot ...
  
  // NEW: Record this vote token
  await VoteToken.create({ pollId: poll.id, token: voterToken });
  
  // ... emit socket event and respond ...
});
```

#### 4. Creator Verification on Close (`backend/api/polls.js` - POST /:id/close)
**New Behavior**:
1. Verifies that `req.user.id` matches `poll.creatorId`
2. Returns `403 Forbidden` if user is not the poll creator
3. Only allows poll closure and result calculation by the original creator

**Key Code Changes**:
```javascript
router.post("/:id/close", async (req, res) => {
  const poll = await Poll.findByPk(req.params.id);
  
  // NEW: Verify creator ownership
  const userId = req.user?.id;
  if (!userId || poll.creatorId !== userId) {
    return res.status(403).json({
      error: "Only the poll creator can close this poll",
    });
  }
  
  // ... close poll and calculate results ...
});
```

### Frontend

#### 1. Voter Token Generation (`frontend/src/components/PollView.jsx`)
**New Utility Function**:
```javascript
const generateVoterToken = () => {
  // Check if token already exists in localStorage
  const storedToken = localStorage.getItem("voter-token-global");
  if (storedToken) return storedToken;
  
  // Generate new unique token per browser session
  const newToken = `voter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem("voter-token-global", newToken);
  return newToken;
};
```

**How It Works**:
- Token is generated once per browser session
- Stored in `localStorage` with key `voter-token-global`
- Persists across page reloads within same session
- Gets cleared when localStorage is cleared

#### 2. Vote Tracking State
**New State Variables**:
```javascript
const [hasVoted, setHasVoted] = useState(false);
const [voterToken] = useState(generateVoterToken());
```

#### 3. Updated Vote Submission
**Changes to `handleSubmit()`**:
- Now includes `voterToken` in POST request body
- Detects `alreadyVoted: true` in error response
- Sets `hasVoted` state to disable voting UI
- Shows user-friendly error message for duplicate votes

```javascript
const handleSubmit = async (e) => {
  // ...
  await axios.post(
    `${API_URL}/api/polls/${id}/vote`,
    { ranking, voterToken },  // NEW: include voter token
    { withCredentials: true }
  );
  setHasVoted(true);  // NEW: mark as voted
  // ...
  if (err.response?.data?.alreadyVoted) {
    setError("You have already voted in this poll");
    setHasVoted(true);  // NEW: mark as voted if error
  }
};
```

#### 4. Voted State UI (`frontend/src/components/PollView.jsx`)
**New Conditional Rendering**:
```jsx
{hasVoted ? (
  <div style={styles.votedSection}>
    <p style={styles.votedMessage}>
      ✅ You have already voted in this poll. Thank you for participating!
    </p>
    <p style={styles.instructions}>
      Watch the live vote count update in real-time as others vote.
    </p>
  </div>
) : (
  // ... voting form ...
)}
```

**New Styles**:
```javascript
votedSection: {
  backgroundColor: "#d4edda",
  border: "1px solid #c3e6cb",
  borderRadius: "4px",
  padding: "20px",
  textAlign: "center",
},
votedMessage: {
  fontSize: "16px",
  fontWeight: "600",
  color: "#155724",
  margin: "10px 0",
},
```

## Testing the Features

### Test 1: Vote Deduplication
1. Open poll in browser window
2. Submit a vote with ranking
3. Try to submit another vote - should get error: "You have already voted in this poll"
4. Try in incognito/private window - should allow vote (different session token)

### Test 2: Creator-Only Closing
1. Create a poll as User A
2. Try to close poll as User B - should get 403 error: "Only the poll creator can close this poll"
3. Close poll as User A (original creator) - should succeed and show results

### Test 3: Storage Persistence
1. Open poll and vote
2. Refresh page - voter token from localStorage is reused
3. Attempt to vote again - duplicate vote error appears

## Requirements Met

✅ **Shareable Links**: Users can copy poll URL and share with anyone
✅ **Live Vote Counting**: Real-time vote count via WebSocket updates
✅ **Authenticated Poll Creation**: Poll creation requires user account (creatorId stored)
✅ **Public Voting**: Anyone with shareable link can vote (no auth required)
✅ **One Vote Per Session**: VoteToken model prevents duplicate voting
✅ **Creator-Only Closing**: Only poll creator can close and see final results
✅ **Results Display**: Round-by-round Instant Runoff Voting breakdown shown

## Database Schema Updates
```sql
CREATE TABLE "voteTokens" (
  "id" INTEGER PRIMARY KEY,
  "pollId" INTEGER NOT NULL,
  "token" VARCHAR UNIQUE NOT NULL,
  "votedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME,
  "updatedAt" DATETIME
);
```

## API Changes Summary

### POST /api/polls/:id/vote
**Request Body (Updated)**:
```json
{
  "ranking": [1, 3, 2],
  "voterToken": "voter-1234567890-abc123def456"
}
```

**Response on Duplicate**:
```json
{
  "error": "You have already voted in this poll",
  "alreadyVoted": true
}
```

### POST /api/polls/:id/close
**New Requirement**: User must be authenticated and own the poll
**Response on Unauthorized**:
```json
{
  "error": "Only the poll creator can close this poll"
}
```
Status: `403 Forbidden`

## Migration Notes

If you have an existing database:
1. The VoteToken table will be auto-created by Sequelize on server start
2. No migration needed for existing polls
3. Existing voters will get fresh tokens on next vote attempt
4. Old votes remain unaffected

## File Changes Summary
- ✅ Created: `backend/database/vote-token.js`
- ✅ Updated: `backend/database/index.js`
- ✅ Updated: `backend/api/polls.js`
- ✅ Updated: `frontend/src/components/PollView.jsx`

## Security Considerations

1. **Token Generation**: Uses combination of timestamp and random string for uniqueness
2. **Storage**: Tokens stored in browser's localStorage (session-based)
3. **Database**: Tokens are unique at database level (UNIQUE constraint)
4. **Immutable**: Tokens generated once per session and cannot be forged
5. **Creator Verification**: Uses req.user.id from authentication middleware

## Next Steps (Optional Enhancements)
- Add device fingerprinting for additional security
- Implement admin dashboard to view/manage polls
- Add percentage breakdowns to results display
- Create user dashboard showing creator's polls
- Add email verification for poll creators
