# 🧪 Two-Tier User System - Testing Guide

## Quick Start

**Frontend**: http://localhost:3000
**Backend**: http://localhost:8080

Both servers are running with hot reload enabled!

---

## 🚀 Test Scenario 1: Anonymous User Discovers App

### Steps:
1. Open http://localhost:3000 in **Browser A**
2. You should see:
   - ✅ Home page with features listed
   - ✅ "Login to Create Polls" button (not "Create Your First Poll")
   - ✅ Auth section with "Login" and "Sign Up" links
   - ✅ Message: "You need to be logged in to create polls"

3. Click "Create Your First Poll" button → **Should redirect to login page** ✅

---

## 🔐 Test Scenario 2: Sign Up & Create First Poll

### Steps:
1. Click "Sign Up" on home page
2. Enter credentials:
   - Username: `testuser1`
   - Password: `password123`
3. Click "Sign Up" → **Should redirect to home page** ✅
4. Should show username in navbar: "Welcome, testuser1" ✅
5. Click "Create Your First Poll"
   - Should load create form (not redirect to login)
6. Enter poll details:
   - Title: "Best Programming Language"
   - Options: Python, JavaScript, Go, Rust
7. Click "Create Poll" → **Redirected to poll page** ✅
8. Verify on poll page:
   - ✅ Poll title displays
   - ✅ "Close Poll & Calculate Results" button visible
   - ✅ Vote counter shows "📊 0 votes"
   - ✅ Voting interface visible
   - ✅ "Share This Poll" section visible

---

## 🔗 Test Scenario 3: Share Poll with Anonymous User

### Steps (continuing from Scenario 2):
1. In **Browser A** (logged in):
   - Click "📋 Copy Link" button in "Share This Poll" section
   - Should see success message: "Poll link copied to clipboard!"

2. Open **Browser B** (fresh/incognito window)
   - Paste the poll link (should be something like `http://localhost:3000/poll/1`)
   - Should see the **SAME POLL** with same title and options
   - Verify:
     - ✅ Poll title displays
     - ✅ Vote count shows (should be "📊 0 votes" or more if others voted)
     - ✅ **NO "Close Poll" button** (this is key!)
     - ✅ Voting interface available
     - ✅ Can drag/arrange options

---

## 🗳️ Test Scenario 4: Anonymous User Votes

### Steps (continuing from Scenario 3):
1. In **Browser B** (anonymous):
   - Drag options to rank them:
     1. Go
     2. Python
     3. JavaScript
     4. Rust
   - Click "Submit Vote"
   - Should see message: "✅ You have already voted in this poll. Thank you for participating!"
   - Should see: "📊 1 vote" (vote count updated)
   - Voting interface should be gone

2. Try voting again:
   - Page should show "You have already voted" message
   - Cannot submit another vote ✅ (deduplication working)

3. In **Browser A** (creator):
   - Vote counter should update to "📊 1 vote" in real-time
   - You should see "🔴 Live" indicator briefly ✅

---

## 📊 Test Scenario 5: Creator Closes Poll & Views Results

### Steps (continuing from Scenario 4):
1. In **Browser A** (creator):
   - Should still see "Close Poll & Calculate Results" button
   - Should see vote count: "📊 X votes"

2. Click "Close Poll & Calculate Results"
   - Page should update to show results section
   - Should display:
     - ✅ 🏆 Winner: "Go wins!" (or whichever has most votes)
     - ✅ "View detailed rounds" section
     - ✅ "Share Results" section with copy button
   - Voting interface should be gone
   - Close button should be gone

---

## 🔒 Test Scenario 6: Anonymous User Cannot See Results

### Steps (continuing from Scenario 5):
1. In **Browser B** (anonymous):
   - Refresh the page
   - Should see:
     - ✅ Poll title: "Best Programming Language"
     - ✅ Vote count (if visible)
     - ✅ Message: "Poll Closed - Results are only visible to the creator."
     - ✅ **NOT** the actual results/winner
     - ✅ **NO** close button
     - ✅ **NO** detailed rounds
     - ✅ **NO** "Share Results" section

---

## 👤 Test Scenario 7: Multiple Users & Concurrent Voting

### Steps:
1. Open **3 browser windows**:
   - Browser A: Creator (logged in as testuser1)
   - Browser B: Anonymous voter 1
   - Browser C: Anonymous voter 2

2. Create new poll in Browser A:
   - Title: "Best Editor"
   - Options: VS Code, Vim, IntelliJ, Sublime Text

3. Copy link to poll, paste in Browser B:
   - Vote: VS Code > Vim > IntelliJ > Sublime
   - Submit vote

4. Watch Browser A:
   - Vote counter updates to "📊 1 vote" ✅
   - "🔴 Live" indicator shows briefly ✅

5. Paste link in Browser C:
   - Vote: Vim > VS Code > Sublime > IntelliJ
   - Submit vote

6. Watch Browser A:
   - Vote counter updates to "📊 2 votes" ✅

7. In Browser A, click "Close Poll"
   - Winner calculated using instant runoff voting
   - Results shown to creator ✅

8. In Browser B and C:
   - See "Poll Closed" message
   - DO NOT see results ✅

---

## 🔑 Test Scenario 8: Login with Different User

### Steps:
1. Open **Browser D** (fresh/incognito)
2. Click "Login"
3. Enter credentials:
   - Username: `testuser1`
   - Password: `password123`
4. Click Login → Should go to home page
5. Should show: "Welcome, testuser1" in navbar ✅
6. Try to create a poll:
   - Click "Create Your First Poll" → Works ✅
7. Logout:
   - Click "Logout" in navbar
   - Username should disappear
   - Home page should show "Login to Create Polls" button ✅

---

## ❌ Test Scenario 9: Error Handling

### Test 9A: Invalid Login
1. Click "Login"
2. Enter invalid credentials:
   - Username: `nonexistent`
   - Password: `wrongpassword`
3. Should show error: "Invalid credentials" ✅

### Test 9B: Poll Not Found
1. Visit: `http://localhost:3000/poll/99999`
2. Should show: "Poll not found" ✅

### Test 9C: Create Poll Without Auth
1. Direct access (without logging in first):
2. Visit: `http://localhost:3000/create`
3. Should redirect to `/login` ✅

### Test 9D: Unauthorized Close Attempt
1. Creator's poll URL: `http://localhost:3000/poll/1`
2. In anonymous browser, open dev tools → Network tab
3. Try to POST to `/api/polls/1/close`
4. Should get 401 Unauthorized (no token) ✅

---

## 📝 Test Scenario 10: Vote Deduplication Across Sessions

### Steps:
1. In **Browser A** (anonymous):
   - Open poll link
   - Vote on the poll
   - See "You have already voted" message ✅

2. Close browser A completely

3. Open **Browser A again**:
   - Open same poll link
   - Should see voting interface (no memory of previous vote)
   - Vote again
   - Vote counter increases ✅ (Different session)

4. In same browser A:
   - Try voting on same poll again
   - Should be blocked (voter token in localStorage) ✅

---

## 🎬 Expected Results Summary

### ✅ Authenticated Users Can:
- [x] Create polls
- [x] See "Close Poll" button on their polls
- [x] View full results after closing
- [x] Share results
- [x] Login and logout

### ✅ Anonymous Users Can:
- [x] View shared polls
- [x] Vote on polls
- [x] See live vote count
- [x] See vote count after voting
- [x] Cannot vote twice (per session)

### ✅ Anonymous Users Cannot:
- [x] Create polls (redirected to login)
- [x] Close polls (button hidden)
- [x] View detailed results (message shown)
- [x] Share results
- [x] See "Close Poll" button

---

## 🐛 Troubleshooting

### Frontend Not Updating
- Hard refresh: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
- Clear localStorage: Open dev tools → Application → Clear All

### Backend Not Responding
- Check: `http://localhost:8080/api/test-db` should return 200
- Check terminal for errors

### Cannot Login
- Make sure you signed up first
- Check username/password are correct (case-sensitive)

### Poll Not Found
- Make sure poll ID in URL is correct
- Check database has polls (can check with test endpoint)

### Results Not Showing
- Make sure you're logged in as the creator
- Make sure poll is closed (click "Close Poll & Calculate Results")

---

## 📊 Expected Vote Counter Behavior

| Scenario | Behavior | Status |
|----------|----------|--------|
| New poll created | Shows "📊 0 votes" | ✅ |
| First vote submitted | Updates to "📊 1 vote" | ✅ |
| Anonymous votes 2nd time | Blocked, shows "already voted" | ✅ |
| Fresh browser votes | Counter increases | ✅ |
| Creator closes poll | Counter visible but no new votes | ✅ |
| Anonymous user views closed poll | Can see vote count | ✅ |

---

## 🎯 Full Test Checklist

- [ ] Anonymous user sees home page
- [ ] Can't create poll without login
- [ ] Can login/signup
- [ ] Logged-in user can create poll
- [ ] Creator sees close button
- [ ] Share link works in new tab
- [ ] Anonymous voter votes successfully
- [ ] Vote deduplication works
- [ ] Live vote count updates
- [ ] Creator closes poll successfully
- [ ] Creator sees results
- [ ] Anonymous user sees poll closed message
- [ ] Anonymous user doesn't see results
- [ ] Logout works
- [ ] Can login again with same credentials
- [ ] Error handling works properly

---

## 🎉 Ready to Test!

All scenarios should work smoothly. If you find any issues, check the browser console (F12) and backend terminal for error messages.

**Good luck testing!** 🚀
