# Testing Vote Deduplication & Creator Verification

## Prerequisites
- Both backend and frontend servers running
- Backend: `npm run start-dev` on port 8080
- Frontend: `npm run start-dev` on port 3000
- Database tables synced (Sequelize auto-creates `voteTokens` table on startup)

## Quick Test Checklist

### Test 1: Vote Deduplication (Same Session)
**Goal**: Verify a voter cannot vote twice in the same poll within one browser session

1. Open http://localhost:3000
2. Create a new poll with 3+ options (e.g., "Favorite Color" with Red, Blue, Green)
3. Copy the poll URL from the address bar
4. Click "Create Poll" to navigate to the new poll's voting page
5. Rank the options and click "Submit Vote"
   - Expected: ✅ "Your vote has been submitted!" message appears
   - UI changes to show: "✅ You have already voted in this poll"
6. Try clicking "Submit Vote" again
   - Expected: Form should not be interactive or button should be disabled
7. Check browser console (F12 > Console)
   - Expected: No errors, clean socket.io connection logs

**What's Happening Behind the Scenes**:
- Step 5: Frontend generates voter token, sends with ranking to `/api/polls/:id/vote`
- Backend creates VoteToken record with pollId and token
- Step 6: Frontend sets `hasVoted = true`, voting form is replaced with "already voted" message
- Backend would return 400 error if form somehow resubmitted (double protection)

---

### Test 2: Vote Deduplication (Different Sessions)
**Goal**: Verify different browser sessions CAN vote independently

1. Open http://localhost:3000 in **Browser Window A** (or Chrome, Firefox, etc.)
2. Open http://localhost:3000 in **Browser Window B** (different browser/incognito)
3. Both access the same poll URL
4. In Window A: Rank and submit vote
   - Expected: ✅ "Your vote has been submitted!"
5. In Window B: Rank differently and submit vote
   - Expected: ✅ "Your vote has been submitted!"
6. Check live vote counter
   - Expected: Shows 2 total votes received

**Why This Works**:
- Each browser session gets unique `voter-token-global` in localStorage
- Window A token: `voter-1234567890-abc123`
- Window B token: `voter-0987654321-xyz789`
- Backend accepts both tokens as they're unique

---

### Test 3: Creator-Only Poll Closing
**Goal**: Verify only the poll creator can close their poll

#### Setup: Create Two User Accounts
1. In Browser A: Go to http://localhost:3000/signup
2. Create User A: Email: `alice@test.com`, Password: `password123`
3. In Browser B: Go to http://localhost:3000/signup  
4. Create User B: Email: `bob@test.com`, Password: `password123`

#### Test Scenario
1. **Browser A (Alice logged in)**:
   - Go to /create
   - Create poll: "Favorite Programming Language" with options: Python, JavaScript, Go
   - Click "Submit" → Navigates to poll page
   - **Copy poll URL**: e.g., `http://localhost:3000/poll/5`
   - Notice: "Close Poll & Calculate Results" button is visible (Alice is creator)

2. **Browser B (Bob logged in)**:
   - Paste poll URL from step 1
   - See poll voting interface
   - Notice: "Close Poll & Calculate Results" button is hidden/disabled (Bob didn't create it)
   - Try voting: Submit vote successfully

3. **Browser B (Bob tries to close via DevTools)**:
   - Open F12 > Console
   - Run: 
     ```javascript
     const id = 5; // from URL
     await fetch('http://localhost:8080/api/polls/' + id + '/close', 
       { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }
     ).then(r => r.json()).then(console.log)
     ```
   - Expected Response: 
     ```json
     {
       "error": "Only the poll creator can close this poll"
     }
     ```
   - Status: 403 Forbidden

4. **Browser A (Alice closes poll)**:
   - Click "Close Poll & Calculate Results" button
   - Expected: ✅ Poll closes, results display with IRV breakdown
   - Bob's view auto-updates to show results (if watching)

---

### Test 4: Live Vote Counting
**Goal**: Verify real-time vote updates across browsers via WebSocket

1. **Browser A**: Open poll
2. **Browser B**: Open SAME poll in different tab/window
3. **Browser A**: Submit vote → "🔴 Live Votes: 1" appears
4. **Browser B**: Should see count jump to 1 automatically (within 1 second)
5. **Browser B**: Submit vote → "🔴 Live Votes: 2" appears  
6. **Browser A**: Should auto-update to 2
7. Check results IRV breakdown
   - Should show correct vote counts
   - Round-by-round elimination if applicable

**Debugging Socket Events**:
In browser console:
```javascript
// Check socket connection status
io.sockets
// or manually check:
console.log('Testing socket...') // Check console logs during vote submission
```

---

### Test 5: Results Display (Creator vs Voter)
**Goal**: Verify only creator sees detailed results

1. **Creator's View**:
   - Close poll as creator
   - See full results: winner, rounds breakdown, tie information
   - Can copy results link

2. **Voter's View** (Browser B before closing):
   - See live vote counter
   - Cannot close poll (button invisible)
   - After creator closes: see results auto-update

---

### Test 6: Shareable Links
**Goal**: Verify links work correctly

1. Create poll as User A
2. Copy vote link: `http://localhost:3000/poll/5`
3. Open in incognito window (new session):
   - Should see voting form
   - Vote successfully (new session = new token)
   - Should NOT be blocked by existing vote

4. Copy results link (after closing):
   - Share with anyone
   - Both voter and non-voter can view results
   - Results show winner and voting breakdown

---

## Database Verification

### Check VoteTokens Table
Open any SQL client or use backend API test:

```bash
# In backend directory
node -e "
const { db, VoteToken } = require('./database');
db.sync().then(() => {
  VoteToken.findAll().then(tokens => {
    console.log('Vote Tokens:', tokens.length);
    console.log(tokens.map(t => ({ pollId: t.pollId, token: t.token.substring(0, 20) + '...', votedAt: t.votedAt })));
  });
});
"
```

Expected output:
```
Vote Tokens: 3
[
  { pollId: 1, token: 'voter-1234567890-ab...', votedAt: 2024-... },
  { pollId: 1, token: 'voter-0987654321-xy...', votedAt: 2024-... },
  { pollId: 2, token: 'voter-5555555555-zz...', votedAt: 2024-... }
]
```

---

## Common Issues & Troubleshooting

### Issue: Vote submitted but form still shows submit button
**Solution**: 
- Clear localStorage: Press F12 > Application > Storage > Clear All
- Refresh page
- Try voting again

### Issue: "You have already voted" error on first attempt
**Solution**:
- Check if you voted in this poll before
- Try voting in **different poll**
- Or clear localStorage and try again

### Issue: Creator cannot close poll (403 error)
**Solution**:
- Verify you're logged in to the correct account
- Check that `creatorId` in database matches your `userId`
- Check authentication token is valid (cookies/localStorage)

### Issue: Live vote counter not updating
**Solution**:
- Check browser console (F12) for socket.io errors
- Verify both browser windows have same poll URL
- Check backend logs for socket connection messages
- Try refreshing page to rejoin poll room

### Issue: Different sessions still can't vote separately
**Solution**:
- Incognito/Private windows must be in **different browsers** (Chrome incognito ≠ Firefox incognito)
- Or clear localStorage in one browser before opening second vote
- Check DevTools > Application > Storage > Local Storage for `voter-token-global` key

---

## Performance Notes

- Vote submission: < 100ms (local network)
- Live update delay: 50-200ms via WebSocket
- Database query for duplicate check: < 10ms

---

## Success Criteria

✅ All tests pass without errors
✅ Vote deduplication working (same session blocked, different sessions allowed)
✅ Creator can close, others cannot
✅ Live vote counting updates in real-time
✅ Shareable links work for voting and results
✅ Database properly stores VoteTokens
✅ No console errors or warnings
✅ Responsive UI feedback for all actions

---

## Cleanup (After Testing)

To reset and start fresh:

```bash
# Clear SQLite database (it will be recreated on next server start)
rm backend/database.sqlite

# Clear localStorage in browser
# F12 > Application > Local Storage > http://localhost:3000 > Clear All

# Restart backend server
# It will recreate database.sqlite with fresh schema
```

---

## Recording a Demo

1. **Screen Recording Tool**: OBS Studio (free) or built-in screen recorder
2. **Script**:
   - "Creating a poll..." (show creation form)
   - "Voting from two different sessions..." (two browsers side-by-side)
   - "Live vote counter updates..." (show real-time updates)
   - "Creator closing poll..." (show results)
   - "Results shared with non-creators..." (show shareable link)

3. **Result**: 2-3 minute demo showing all features working
