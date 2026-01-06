# Ranked Choice Voting App - Implementation Summary

## Overview
I've successfully implemented a complete ranked choice voting application based on the README requirements. The application allows users to create polls, share them with voters, collect ranked ballots, and compute results using the instant runoff voting (IRV) algorithm.

## What Was Implemented

### Backend Implementation

#### 1. Database Models (`backend/database/`)
- **poll.js** - Poll model with fields: title, isOpen, creatorId
- **option.js** - Option model for poll choices with fields: text, pollId
- **ballot.js** - Ballot model for storing voter rankings with fields: ranking (JSON array of option IDs), pollId
- **index.js** - Updated to export all three new models alongside User

#### 2. API Routes (`backend/api/polls.js`)
Created a comprehensive polls router with 4 main endpoints:

- **POST /api/polls** - Create a new poll
  - Request: `{ title, options: [] }`
  - Response: `{ poll, options }`
  - Validates at least 2 options are provided

- **GET /api/polls/:id** - Fetch a poll with its options
  - Response: `{ poll, options }`
  - Includes all voting options for a poll

- **POST /api/polls/:id/vote** - Submit a ranked ballot
  - Request: `{ ranking: [optionId1, optionId2, ...] }`
  - Validates poll is open and IDs are valid
  - Stores ballot in database

- **POST /api/polls/:id/close** - Close poll and compute results
  - Closes the poll (sets isOpen to false)
  - Executes instant runoff voting algorithm
  - Returns winner and detailed round-by-round tallying

#### 3. Instant Runoff Voting Algorithm
Implemented a complete IRV algorithm that:
- Counts first-preference votes for remaining candidates
- Checks for majority winner (>50% of votes)
- Eliminates candidate(s) with fewest votes
- Repeats until winner found or tie detected
- Returns detailed information about each round

#### 4. API Router Mount
Updated `backend/api/index.js` to mount the polls router at `/api/polls`

### Frontend Implementation

#### 1. Components (`frontend/src/components/`)

**PollCreate.jsx** - Poll creation form
- Input for poll title
- Dynamic option list (add/remove options)
- Form validation
- Redirects to poll view after creation

**PollView.jsx** - Poll voting and results display
- Display poll title and options
- Drag-and-drop style ranking (up/down buttons)
- Submit ranked ballot
- Share URL display for poll creators
- Close poll button for creators
- Results display with IRV breakdown
- Shows winner or tie result with round-by-round details

#### 2. Routing (`frontend/src/App.jsx`)
Added routes:
- `/create` - PollCreate component
- `/poll/:id` - PollView component

#### 3. Navigation Updates
Updated NavBar component to:
- Show "Create Poll" link when user is authenticated
- Display username when logged in
- Update styling for new layout

#### 4. Home Page Enhancement
Updated Home.jsx with:
- Welcoming information about the app
- Feature highlights (Create polls, Share links, Ranked voting, Results)
- Call-to-action button to create a poll
- Step-by-step instructions

#### 5. Styling
Enhanced all CSS components with:
- Clean, modern card-based design
- Consistent color scheme
- Responsive layout
- Improved user feedback (success/error messages)

## Features Implemented

✅ **Poll Creation** - Users can create polls with custom titles and options
✅ **Poll Sharing** - Generated links can be shared with voters
✅ **Ranked Voting** - Voters can rank options by preference
✅ **Instant Runoff Voting** - Proper IRV algorithm implementation
✅ **Result Calculation** - Automatic tally when poll closes
✅ **Round Details** - Display round-by-round voting information
✅ **Open/Closed State** - Polls can be closed to prevent more votes
✅ **Error Handling** - Comprehensive error messages for user feedback
✅ **Form Validation** - Client and server-side validation

## How to Use

### Creating a Poll
1. Navigate to the app and click "Create Poll"
2. Enter a poll title and at least 2 options
3. Click "Create Poll"
4. Share the generated URL with voters

### Voting on a Poll
1. Access the poll via the shared link
2. Drag or use up/down arrows to rank options
3. Click "Submit Vote"

### Viewing Results
1. As a poll creator, click "Close Poll & Calculate Results"
2. Results display the winner and round-by-round tally
3. Ties are indicated if all remaining options are tied

## Technical Details

### Database Schema
- Polls store title, status, and creator
- Options are linked to polls
- Ballots store ranked preferences as JSON arrays

### Authentication
- Uses existing auth system (optional, polls work without auth)
- Polls can be created by anyone, creator ID is optional

### Instant Runoff Voting
The algorithm implements the standard IRV method:
1. Count first preferences
2. If majority found, declare winner
3. Otherwise, eliminate lowest vote-getter(s)
4. Repeat with remaining candidates

## Installation & Running

```bash
# Backend
cd backend
npm install
npm run start-dev

# Frontend (in new terminal)
cd frontend
npm install
npm start
```

The backend runs on `http://localhost:8080`
The frontend runs on `http://localhost:3000`

## Files Changed/Created

### Backend
- `/backend/database/poll.js` (NEW)
- `/backend/database/option.js` (NEW)
- `/backend/database/ballot.js` (NEW)
- `/backend/database/index.js` (UPDATED)
- `/backend/api/polls.js` (NEW)
- `/backend/api/index.js` (UPDATED)

### Frontend
- `/frontend/src/components/PollCreate.jsx` (NEW)
- `/frontend/src/components/PollView.jsx` (NEW)
- `/frontend/src/App.jsx` (UPDATED)
- `/frontend/src/components/NavBar.jsx` (UPDATED)
- `/frontend/src/components/NavBarStyles.css` (UPDATED)
- `/frontend/src/components/Home.jsx` (UPDATED)
- `/frontend/src/components/HomeStyles.css` (UPDATED)

## Notes

- The app stores poll rankings as JSON arrays in the database
- The instant runoff voting is calculated server-side for accuracy
- Error handling provides user-friendly feedback
- The frontend uses existing infrastructure (axios, React Router, etc.)
- All existing authentication and user features remain intact
