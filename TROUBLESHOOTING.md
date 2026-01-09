# Troubleshooting: Share Poll & Live Votes Not Working

## Quick Diagnosis Steps

### 1. Check Socket.IO Connection
Open browser Developer Tools (F12) → Console and paste:
```javascript
// Check if socket.io is loaded
console.log("socket.io-client version:", io.version || "unknown");

// Test socket connection manually
const testSocket = io("http://localhost:8080", { withCredentials: true });
testSocket.on("connect", () => console.log("✅ Socket connected!"));
testSocket.on("connect_error", (err) => console.log("❌ Socket error:", err));
```

### 2. Check API Connectivity
In browser console:
```javascript
// Test API endpoint
fetch("http://localhost:8080/api/polls/1", { 
  credentials: "include",
  headers: { "Content-Type": "application/json" }
})
.then(r => r.json())
.then(d => console.log("API Response:", d))
.catch(e => console.log("API Error:", e));
```

### 3. Check CORS & Network Issues
In Developer Tools:
1. Go to Network tab (F12 > Network)
2. Create or view a poll
3. Look for:
   - `socket.io` requests → should be green 200/101 status
   - API calls like `GET /api/polls/1` → should be green 200 status
   - Check for red 403/404/500 errors

### 4. Check Browser Console Logs
F12 > Console and look for:
```
✅ Socket connected - should see this
📊 New vote received - should see this when voting
🔗 Connected to live poll updates - should see in PollView
```

---

## What Changed (Latest Fix)

### Frontend (shared.js)
**Changed**: Socket URL from `ws://localhost:8080` to `http://localhost:8080`
**Why**: Socket.io automatically handles protocol upgrade (http→ws), so we should use http://

### Backend (socket-server.js)
**Changed**: CORS configuration to always use `{ origin: FRONTEND_URL, credentials: true }`
**Why**: Fixed CORS issues that were blocking socket connections

---

## Testing Checklist

### Test 1: Share Poll Link
1. ✅ Go to http://localhost:3000
2. ✅ Click "Create Poll" button
3. ✅ Create a new poll: "Best Color" with options: Red, Blue, Green
4. ✅ After creation, you'll be taken to the poll page
5. ✅ Look for a "Copy Link" button with 📋 icon
6. ✅ Click it → Should say "Poll link copied to clipboard!"
7. ✅ Paste the URL in another tab/browser/incognito window
8. ✅ Should be able to see and vote on the poll

**If not working**:
- Check if "Copy Link" button is visible on the page
- Check browser console (F12) for JavaScript errors
- Try clearing localStorage: `localStorage.clear()` in console

---

### Test 2: Live Vote Count
1. ✅ Open poll in **Browser Window A**
2. ✅ Open **SAME POLL** in **Browser Window B** (copy the URL)
3. ✅ In Window A: Rank options and click "Submit Vote"
4. ✅ In Window B: You should see "🔴 Live Votes: 1" appear or update
5. ✅ In Window B: Submit your vote
6. ✅ In Window A: You should see count jump to 2

**If not working**:
- Check F12 Console for socket connection errors
- Check Network tab for socket.io connections (should have status 101 Switching Protocols)
- Verify both browsers are on SAME poll URL
- Try refreshing one browser window

---

### Test 3: Debug Socket Connection
In **both** browser windows, open F12 > Console and run:
```javascript
// Check socket connection status
io.sockets ? console.log("Socket exists") : console.log("No socket");

// Better: just look for console logs that say:
// "🔗 Connected to live poll updates"
// "📊 New vote received: {data}"
```

---

## Common Issues & Solutions

### Issue: "Share Poll button not visible"
**Solution**:
1. Scroll down on the poll page
2. Look for "Share" section with a blue "📋 Copy Link" button
3. If not visible, check browser DevTools (F12 > Elements) for the button HTML

### Issue: "Live votes not updating"
**Solution**:
1. Check F12 > Console for: `🔗 Connected to live poll updates`
2. If not there → socket connection failed
3. Fix: Clear cache (Ctrl+Shift+Delete), then F5 refresh
4. Check that both browser windows have SAME poll URL

### Issue: Socket connection error in console
**Typical Error**: `GET http://localhost:8080/socket.io/?... 404`
**Solution**:
- Backend didn't initialize socket server properly
- Check backend terminal for "🧦 Socket server initialized"
- If missing: restart backend with `npm run start-dev`

### Issue: CORS error
**Typical Error**: `Access to XMLHttpRequest blocked by CORS policy`
**Solution**:
- Backend CORS configuration needs fixing
- Already done in this update
- Restart backend: `npm run start-dev`

---

## Manual Testing via Terminal

### Test API Endpoint Directly
```bash
# In backend terminal, run:
curl -X GET http://localhost:8080/api/polls/1

# Should return JSON with poll data
```

### Test Vote Submission
```bash
# In any terminal:
curl -X POST http://localhost:8080/api/polls/1/vote \
  -H "Content-Type: application/json" \
  -d '{"ranking": [1, 2, 3], "voterToken": "test-token-123"}'

# Should return { "message": "Ballot submitted successfully" }
```

---

## If Still Not Working

### Step 1: Verify Both Servers Running
```powershell
# Check backend
netstat -ano | findstr ":8080"    # Should show node.exe listening

# Check frontend  
netstat -ano | findstr ":3000"    # Should show node.exe listening
```

### Step 2: Check Backend Logs
Look at backend terminal output for:
```
✅ Connected to the database
🧦 Socket server initialized
🚀 Server is running on port 8080
```

If missing: Restart with `npm run start-dev`

### Step 3: Clear All Caches
```javascript
// In browser console (F12):
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 4: Hard Refresh Frontend
- Windows: Ctrl+Shift+F5 or Ctrl+Shift+Delete (clear cache then reload)
- Mac: Cmd+Shift+R
- Or: F12 > Network > Disable cache, then refresh

### Step 5: Restart Both Servers
```powershell
# Kill backend (Ctrl+C in backend terminal)
# Kill frontend (Ctrl+C in frontend terminal)

# Restart backend
cd c:\Users\danie\Documents\GitHub\Daniel-rcv-polls\backend
npm run start-dev

# In new terminal, start frontend
cd c:\Users\danie\Documents\GitHub\Daniel-rcv-polls\frontend
npm run start-dev
```

---

## Debug Console Log Messages

When everything is working, you should see:

**On Page Load**:
```
🔗 Connected to live poll updates
📊 New vote received: {...}
🔗 Disconnected from live updates (when navigating away)
```

**When Voting**:
```
📊 New vote received: {totalVotes: 2, currentTally: {...}, timestamp: "..."}
```

**If Socket Broken**:
```
🔗 Disconnected from live updates
❌ Socket error: Error: timeout
```

---

## Final Verification

Open http://localhost:3000 and:

1. ✅ Can click "Create Poll"
2. ✅ Can fill form and submit
3. ✅ Redirected to poll URL like `/poll/1`
4. ✅ See poll title and options
5. ✅ See "🔴 Live Votes: 0" somewhere on page
6. ✅ See blue "📋 Copy Link" button
7. ✅ Can rank options
8. ✅ Can click "Submit Vote"
9. ✅ See "Your vote has been submitted!" message
10. ✅ Opening same URL in another window shows live update
11. ✅ Clicking "Close Poll" button shows results

If all ✅, you're good to go! 🎉

---

## Still Having Issues?

Check these files for any problems:

1. **Frontend Connection**:
   - `frontend/src/shared.js` - Should have `http://localhost:8080` for SOCKETS_URL
   - `frontend/src/components/PollView.jsx` - Check socket initialization around line 41-60

2. **Backend Socket Setup**:
   - `backend/socket-server.js` - Check CORS configuration
   - `backend/app.js` - Verify socket server is initialized
   - `backend/api/polls.js` - Check emitPollEvent is called on vote

3. **Environment Variables**:
   - `frontend/.env` - Check SOCKETS_URL
   - `backend/.env` - Check FRONTEND_URL

If none of these work, try the **Final Nuclear Option**:
```bash
# Clear everything and start fresh
rm backend/database.sqlite    # Delete DB
rm -r node_modules            # Delete dependencies (both backend & frontend)
npm install                   # Reinstall (both)
npm run start-dev            # Start servers
```

Good luck! 🚀
