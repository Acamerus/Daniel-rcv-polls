# Quick Reference: Vote Deduplication & Creator Verification

## What Changed? (Quick Summary)

### 🔒 **Vote Deduplication**
- Voters can now only vote **ONCE per browser session** in each poll
- Each browser session gets a unique token stored in localStorage
- Second vote attempt in same session gets blocked with error message

### 👤 **Creator-Only Closing**  
- Only the person who **created the poll** can close it and see results
- Other users' "Close Poll" button is hidden
- If they try to close anyway, get 403 Forbidden error

---

## Files Changed (At a Glance)

| File | Change | Lines |
|------|--------|-------|
| `backend/database/vote-token.js` | ✨ NEW | 16 lines |
| `backend/database/index.js` | Updated | +2 lines |
| `backend/api/polls.js` | Updated | ~100 lines modified |
| `frontend/src/components/PollView.jsx` | Updated | ~50 lines modified |

---

## Key Concepts

### Voter Token
```
What: A unique identifier for each browser session
Where: Stored in localStorage under key "voter-token-global"
Format: "voter-{timestamp}-{random}"
Example: "voter-1704067200000-a1b2c3d4e"
When: Generated on first visit to any poll
Expires: When user clears browser localStorage
```

### creatorId
```
What: User ID of the person who created the poll
Where: Stored in polls table
Used For: Verifying poll ownership before closing
Check: req.user.id === poll.creatorId
```

---

## User Experience Changes

### Before This Update
❌ Voter could submit multiple votes in same poll
❌ Anyone could close anyone's poll
❌ No indication if vote was duplicate

### After This Update
✅ Second vote in same session blocked
✅ Only creator can close their poll
✅ Clear feedback on duplicate votes
✅ "Already voted" message shown prominently

---

## Developer Reference

### Check If Voter Token Exists
```javascript
// Frontend - in PollView.jsx
const voterToken = localStorage.getItem("voter-token-global");
console.log("Current token:", voterToken);
```

### Check If Poll Was Created By Me
```javascript
// In poll response from backend
const isCreator = poll.creatorId === currentUser.id;
console.log("Can I close this?", isCreator);
```

### Database Queries
```javascript
// Check all votes in a poll
const votes = await VoteToken.findAll({ where: { pollId: 5 } });

// Check if specific voter already voted
const voted = await VoteToken.findOne({ 
  where: { pollId: 5, token: "voter-..." } 
});
```

---

## Error Messages Users Will See

### "You have already voted in this poll"
- User tried to submit a second vote in same session
- Browser localStorage still contains their voter token
- Solution: Accept they can't vote twice, view results instead

### "Only the poll creator can close this poll"  
- User tried to close poll but didn't create it
- Status: 403 Forbidden
- Only creator sees the close button anyway

### Endpoint Returns 403 Forbidden
- API rejected the request due to insufficient permissions
- Check if user is authenticated
- Check if user ID matches poll creator ID

---

## How To Test (Quick Version)

### Test 1: Vote Once Per Session
1. Open poll → Vote → See success message
2. Try vote again → See "already voted" error
3. Close browser → Clear localStorage → Can vote in different session

### Test 2: Creator Can Close, Others Can't
1. Create poll as User A
2. Log in as User B, try to close → 403 error  
3. Go back to User A, close successfully → Results show

### Test 3: Live Vote Updates
1. Open poll in 2 browser windows
2. Vote in window 1 → window 2 count updates automatically
3. Vote in window 2 → window 1 count updates automatically

---

## Debugging Commands

### Clear Voter Token (Start Fresh)
```javascript
// In browser console (F12)
localStorage.removeItem("voter-token-global");
location.reload();
```

### Check Token in Storage
```javascript
// In browser console (F12)
console.log(localStorage.getItem("voter-token-global"));
```

### Test Vote Endpoint (Manual)
```javascript
// In browser console (F12)
const response = await fetch('http://localhost:8080/api/polls/1/vote', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ranking: [1, 2, 3],
    voterToken: localStorage.getItem("voter-token-global")
  })
});
console.log(await response.json());
```

### Test Close Endpoint (Manual)
```javascript
// In browser console (F12)
const response = await fetch('http://localhost:8080/api/polls/1/close', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: '{}'
});
console.log(await response.json());
```

---

## Comparison: Before vs After

### Vote Submission Payload

**Before**:
```json
{
  "ranking": [1, 3, 2]
}
```

**After**:
```json
{
  "ranking": [1, 3, 2],
  "voterToken": "voter-1704067200000-abc123"
}
```

### Poll Closing Requirements

**Before**:
- Anyone with poll link could close it

**After**:
- `req.user.id` must exist (authentication required)
- `req.user.id` must equal `poll.creatorId`
- Returns 403 if not creator

---

## Common Scenarios

### Scenario 1: Same Person, Different Devices
- Device A (Desktop): Votes in poll
- Device B (Mobile): Can vote again (different session token)
- ✅ Both votes counted

### Scenario 2: Same Person, Private Window
- Window A: Votes in poll
- Window B (Incognito): Can vote again (different localStorage)
- ✅ Both votes counted

### Scenario 3: Shared Computer
- User A logs in, votes
- User B logs in, tries to vote
- ❌ Gets "already voted" error (same token from first user)
- 💡 Solution: Clear localStorage or use private window

### Scenario 4: Poll Creator Gifts Poll
- Creator A makes poll
- Wants Creator B to manage it
- ❌ Only Creator A can close
- 💡 Solution: Creator A and B would need to be same user

---

## FAQ

**Q: Can I vote on my phone and laptop?**
A: Yes! Each device gets its own voter token.

**Q: What if I clear my browser data?**
A: You'll get a new voter token and can vote again.

**Q: Can I vote if creator closes poll?**
A: No, poll.isOpen becomes false; votes are rejected.

**Q: What if I forget who created a poll?**
A: Check poll.creatorId in database, or check if you can close it.

**Q: Is my vote anonymous?**
A: Yes! Votes are just rankings, no personal data stored.

**Q: Can creator see who voted what?**
A: No, votes are anonymous. Creator sees only final tally.

**Q: What if duplicate voter tokens in database?**
A: Impossible - token column has UNIQUE constraint.

**Q: Can I undo my vote?**
A: No, but you can create a new poll and try again.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. generateVoterToken()                                    │
│     ├─ Check localStorage["voter-token-global"]             │
│     ├─ If exists: use it                                    │
│     └─ If not: create & store new one                       │
│                                                              │
│  2. handleSubmit(ranking)                                   │
│     ├─ POST /api/polls/:id/vote                             │
│     │   ├─ ranking: [1, 3, 2]                               │
│     │   └─ voterToken: "voter-123-abc"                      │
│     ├─ If 200 OK: setHasVoted(true) ✅                      │
│     └─ If 400 + alreadyVoted: show error ❌                 │
│                                                              │
│  3. Conditional Render                                      │
│     ├─ If !hasVoted: show voting form                       │
│     └─ If hasVoted: show "already voted" message            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↕ HTTP + WebSocket ↕
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/polls/:id/vote                                   │
│  ├─ Extract: ranking, voterToken                            │
│  ├─ Validate: poll exists & isOpen                          │
│  ├─ Check: VoteToken.findOne({ pollId, token })             │
│  │   ├─ Found: return 400 "already voted" ❌                │
│  │   └─ Not found: continue ✅                              │
│  ├─ Create: Ballot record                                   │
│  ├─ Create: VoteToken record                                │
│  └─ Emit: socket event "new-vote"                           │
│                                                              │
│  POST /api/polls/:id/close                                  │
│  ├─ Verify: req.user.id exists                              │
│  ├─ Check: req.user.id === poll.creatorId                   │
│  │   ├─ No match: return 403 "not creator" ❌               │
│  │   └─ Match: continue ✅                                  │
│  ├─ Set: poll.isOpen = false                                │
│  ├─ Calculate: IRV results                                  │
│  └─ Return: results + poll data                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (Sequelize)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  polls table:                                               │
│  ├─ id, title, isOpen                                       │
│  ├─ creatorId (FK to users)  ← Used for auth                │
│  └─ createdAt, updatedAt                                    │
│                                                              │
│  voteTokens table: (NEW)                                    │
│  ├─ id, pollId (FK)                                         │
│  ├─ token (UNIQUE)  ← Prevents duplicates                   │
│  └─ votedAt                                                 │
│                                                              │
│  ballots table:                                             │
│  ├─ id, pollId (FK), ranking (JSON)                         │
│  └─ createdAt, updatedAt                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

✨ **What You Get**:
- Prevent multiple votes per session ✅
- Creator-only poll management ✅
- Clear user feedback ✅
- No additional dependencies ✅
- Database ACID compliance ✅

🚀 **Ready to Use**:
- All code deployed and tested
- Database auto-migrations handled
- Frontend fully integrated
- Socket.io real-time working
- IRV algorithm unchanged

📚 **Documentation**:
- VOTE_DEDUPLICATION_UPDATE.md - Technical details
- TESTING_GUIDE.md - How to test features
- This file - Quick reference

---

**Last Updated**: December 2024
**Status**: Production Ready ✅
