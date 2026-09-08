# CollabCode: A Real-Time Collaborative Coding, Peer Review and Contribution Analytics Platform

A web platform where students solve coding problems individually or collaboratively in real time — with peer code review, version history, and contribution analytics built in.

## Project Structure

```
collabcode/
├── server/                 # Backend — Node.js + Express + Socket.io + MongoDB
│   ├── config/             # DB connection, constants, seed script
│   ├── controllers/        # Auth, Problem, Room, Submission, Review controllers
│   ├── middleware/         # JWT auth + error handling
│   ├── models/             # User, Problem, Room, Submission, Review, Contribution
│   ├── routes/             # REST API routes
│   ├── services/           # Judge0 code execution service
│   ├── sockets/            # Socket.io real-time collaboration handler
│   ├── .env.example        # Environment variables template
│   └── server.js           # Entry point
│
├── client/                 # Frontend — React + Vite + Monaco Editor
│   ├── src/
│   │   ├── components/     # Chat, VersionHistory, ReviewPanel, ContributionPanel
│   │   ├── contexts/       # AuthContext
│   │   ├── hooks/          # useToast
│   │   ├── pages/          # Login, Register, Dashboard, ProblemDetail,
│   │   │                   # SoloEditor, Room, Submissions, Leaderboard, MyRooms
│   │   ├── services/       # API client + Socket.io client
│   │   └── utils/          # Constants and helpers
│   └── index.html
│
└── README.md
```

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **Socket.io** — Real-time code sync, chat, cursor tracking
- **MongoDB + Mongoose** — Database
- **JWT + bcryptjs** — Authentication
- **Judge0** — Code execution engine (supports self-hosted or RapidAPI)

### Frontend
- **React 18 + Vite** — Fast dev server & build
- **Monaco Editor** — The same editor that powers VS Code
- **Socket.io Client** — Real-time communication
- **React Router** — Client-side routing

## Features (12 Modules)

1. **User Authentication** — Register, login, JWT-secured routes
2. **Problem Management** — Problems with difficulty, examples, constraints, hidden test cases
3. **Solo Coding Mode** — Individual editor with run/test/submit
4. **Collaborative Coding Room** — Multi-user real-time editing via WebSocket
5. **Monaco Code Editor** — Java, C, C++, Python, JavaScript
6. **Code Execution** — Judge0 compiles and runs code
7. **Custom Test Cases** — Test with your own inputs
8. **Room Chat** — Real-time messaging while solving
9. **Code Version History** — Save and restore code snapshots
10. **Peer Code Review** — Line-level comments, suggestions, bug reports, resolution
11. **Contribution Tracking** — Per-user metrics: chars added/deleted, saves, chat, reviews, submissions
12. **Submission History** — All attempts with results and code

## Unique Feature: Dynamic Collaboration

A student can start a problem in Solo Mode, and if they get stuck, click **Invite Collaborator** to generate a room code and continue the same solution with a friend in real time.

```
Student starts Two Sum alone
  → Writes some code → Gets stuck
  → Clicks "Invite Collaborator"
  → Room code generated: CC7421
  → Friend joins → Same existing code appears
  → Both solve together
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Judge0 (optional — falls back to simulation mode)

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env   # Edit with your config
npm run seed           # Load sample problems
npm run dev            # Start server on port 5000
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev            # Start on port 5173
```

### 3. Judge0 Setup (Optional)

The server falls back to a **simulation mode** if Judge0 is unreachable, so you can develop and demo without it. To enable real code execution:

**Option A — Self-hosted (Docker):**
```bash
docker run -d -p 2358:2358 judge0/judge0:latest
```
Set in `.env`:
```
JUDGE0_API_URL=http://localhost:2358
JUDGE0_API_KEY=
```

**Option B — RapidAPI:**
Sign up at [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce).
Set in `.env`:
```
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_key
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/auth/leaderboard` | Get leaderboard |

### Problems
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/problems` | List all problems (with filters) |
| GET | `/api/problems/slug/:slug` | Get problem by slug |
| GET | `/api/problems/:id` | Get problem by ID |

### Rooms
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms` | Create room |
| POST | `/api/rooms/join/:roomCode` | Join room |
| GET  | `/api/rooms/:roomCode` | Get room info |
| GET  | `/api/rooms/my` | My rooms |
| POST | `/api/rooms/:roomCode/versions` | Save version |
| POST | `/api/rooms/:roomCode/versions/:versionId/restore` | Restore version |
| GET  | `/api/rooms/:roomCode/versions` | Get version history |
| POST | `/api/rooms/:roomCode/chat` | Post chat message |
| GET  | `/api/rooms/:roomCode/contributions` | Get contribution analytics |

### Submissions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/submissions/run` | Run code |
| POST | `/api/submissions/test` | Test against visible test cases |
| POST | `/api/submissions/submit` | Submit (all test cases) |
| GET  | `/api/submissions` | My submission history |
| GET  | `/api/submissions/:id` | Get single submission |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| POST  | `/api/reviews/:roomCode` | Create review |
| GET   | `/api/reviews/:roomCode` | Get room reviews |
| POST  | `/api/reviews/:reviewId/comments` | Add comment |
| PATCH | `/api/reviews/:reviewId/comments/:commentId` | Toggle resolve |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client→Server | Join a room |
| `code:edit` | Client→Server | Broadcast code changes |
| `code:update` | Server→Client | Receive code changes |
| `code:language` | Bidirectional | Language change |
| `chat:message` | Bidirectional | Chat messages |
| `typing:start/stop` | Bidirectional | Typing indicator |
| `cursor:move` | Client→Server | Cursor position |
| `version:saved` | Server→Client | Version snapshot saved |
| `contribution:update` | Client→Server | Contribution delta |
| `user:joined/left` | Server→Client | User presence |
| `room:users` | Server→Client | Online users list |

## Languages Supported
- Python 3
- Java
- C++
- C
- JavaScript (Node.js)

## License
This is an academic project. Free to use for educational purposes.
