# Quick Start Guide - Ranked Choice Voting App

## Prerequisites
- Node.js and npm installed
- PostgreSQL running (for database)

## Installation

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Running the Application

### Terminal 1 - Start Backend Server
```bash
cd backend
npm run start-dev
```
You should see:
```
✅ Connected to the database
🚀 Server is running on port 8080
🧦 Socket server initialized
```

### Terminal 2 - Start Frontend Development Server
```bash
cd frontend
npm start
```
The app will open at `http://localhost:3000`

## Using the App

### Step 1: Create a Poll
1. Click "➕ Create Poll" in the navigation bar
2. Enter a poll title (e.g., "Best Programming Language")
3. Add at least 2 options (e.g., "Python", "JavaScript", "Rust")
4. Click "Create Poll"

### Step 2: Share with Voters
1. Copy the URL from the share section
2. Send it to others via email, chat, etc.
3. Voters can access the poll without creating an account

### Step 3: Voters Submit Ranked Ballots
1. Voters click the shared link
2. They rank options using the up/down arrows (1st choice = most important)
3. Click "Submit Vote"
4. They can vote again if needed

### Step 4: View Results
1. Go back to the poll as the creator
2. Click "Close Poll & Calculate Results"
3. View the winner and see round-by-round details

## Example Scenario

**Create a poll:** "What's your favorite pizza topping?"
- Options: Pepperoni, Mushroom, Sausage

**Voter 1's ranking:**
1. Pepperoni
2. Sausage
3. Mushroom

**Voter 2's ranking:**
1. Mushroom
2. Pepperoni
3. Sausage

**Voter 3's ranking:**
1. Sausage
2. Mushroom
3. Pepperoni

**Results:** With IRV, even though no option got majority first-choice votes, the algorithm will eliminate the lowest and recalculate until a winner emerges.

## API Endpoints

All endpoints are at `http://localhost:8080/api/polls/`

### Create Poll
```
POST /api/polls
Body: { "title": "...", "options": ["...", "..."] }
```

### Get Poll
```
GET /api/polls/:id
```

### Submit Vote
```
POST /api/polls/:id/vote
Body: { "ranking": [optionId1, optionId2, ...] }
```

### Close Poll & Calculate
```
POST /api/polls/:id/close
```

## Troubleshooting

### Port Already in Use
If port 3000 or 8080 is already in use:
- Backend: Change PORT in `.env` file
- Frontend: Try a different port when prompted

### Database Connection Error
- Make sure PostgreSQL is running
- Check `.env` file has correct database credentials
- Run `npm run seed` in backend (if available)

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

## Features Overview

🗳️ **Create Polls** - Easy poll creation with multiple options
🔗 **Share Links** - Generate shareable URLs for voters
⬆️⬇️ **Rank Choices** - Intuitive up/down arrow ranking interface
📊 **Instant Runoff** - Automatic calculation using IRV algorithm
📈 **View Details** - See round-by-round voting breakdown
✅ **Validation** - Client and server-side error checking

## Next Steps

- Add user accounts to track who created which polls
- Add poll statistics dashboard
- Add poll expiration dates
- Add email notifications
- Add visual ranking (drag and drop)
- Deploy to production (Heroku, AWS, etc.)
