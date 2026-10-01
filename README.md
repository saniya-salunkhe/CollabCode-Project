# 💻 **CollabCode**

**CollabCode** is a real-time collaborative coding platform where users can solve programming problems, collaborate with other registered users, request help, review solutions, and track their coding activity.

The platform combines coding practice with real-time collaboration features such as synchronized code editing, room invitations, chat, notifications, peer review, and a structured help-request workflow.

---

## 🌐 **Live Demo**

**Frontend:**  
https://collabcode-project.onrender.com

**Backend API:**  
https://collabcode-api-jok1.onrender.com

---

## ✨** Key Features**

- User Registration and Login
- JWT-based Authentication
- Coding Problem Dashboard
- Monaco Code Editor
- Multiple Programming Language Support
- Run and Test Code
- Hidden Test Cases
- Custom Test Cases
- Code Submission History
- Real-Time Collaborative Coding
- Create and Join Coding Rooms
- Invite Registered Users
- Accept or Decline Room Invitations
- Real-Time Code Synchronization
- Online User Tracking
- Real-Time Chat
- Code Version History
- Peer Review
- Contribution Tracking
- Request Help
- Accept Help Requests
- Solution Explanation
- Resolve Help or Ask Again
- Real-Time Notifications
- My Rooms
- My Help Requests
- Leaderboard

---

## 🧑‍💻 **Supported Languages**

- Java
- Python
- C
- C++
- JavaScript

---

## 🛠️** Tech Stack**

### Frontend

- React.js
- Vite
- React Router
- Axios
- Monaco Editor
- Socket.io Client

### Backend

- Node.js
- Express.js
- Socket.io
- JWT
- bcryptjs

### Database

- MongoDB
- MongoDB Atlas
- Mongoose

### Code Execution

- Judge0 API

### Deployment

- Render Static Site
- Render Web Service
- MongoDB Atlas

---

## 🏗️ **System Architecture**
┌──────────────────────────────┐
│      React + Vite Client     │
│  Monaco Editor + Socket.io   │
└───────────────┬──────────────┘
                │
        REST API + Socket.io
                │
                ▼
┌──────────────────────────────┐
│    Node.js + Express API     │
│   JWT + Socket.io Server     │
└──────────────┬───────────────┘
               │
        ┌──────┴───────┐
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│MongoDB Atlas │  │ Judge0 API   │
│   Database   │  │Code Execution│
└──────────────┘  └──────────────┘

📂 **Project Structure**
collabcode/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md

⚙️ **Installation and Local Setup**

Prerequisites
Make sure you have:
- Node.js
- npm
- Git
- MongoDB Atlas account or MongoDB connection
1. Clone the Repository
git clone https://github.com/saniya-salunkhe/CollabCode-Project.git

cd CollabCode-Project

2. Backend Setup
cd server
npm install

Create a .env file inside the server folder:
PORT=5000
MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
JWT_SECRET=YOUR_JWT_SECRET
CLIENT_URL=http://localhost:5173
JUDGE0_API_URL=https://ce.judge0.com

Seed coding problems:
npm run seed

Start the backend:
npm run dev

Backend runs on:
http://localhost:5000

3. Frontend Setup
Open another terminal:
cd client
npm install

Create a .env file inside the client folder:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

Start the frontend:
npm run dev

Frontend runs on:
http://localhost:5173

🔐 **Environment Variables**

Backend
PORT=
MONGO_URI=
JWT_SECRET=
CLIENT_URL=
JUDGE0_API_URL=

Frontend
VITE_API_URL=
VITE_SOCKET_URL=

Production example:
VITE_API_URL=https://collabcode-api-jok1.onrender.com/api
VITE_SOCKET_URL=https://collabcode-api-jok1.onrender.com

🔄 **Main Workflows**

**Problem Solving**

Login
  ↓
Select Problem
  ↓
Open Monaco Editor
  ↓
Write Code
  ↓
Run / Test
  ↓
Submit Solution

**Real-Time Collaboration**

Create Coding Room
        ↓
Invite Registered User
        ↓
User Accepts Invitation
        ↓
Both Users Join the Room
        ↓
Edit Code in Real Time
        ↓
Chat and Solve Together

**Request Help**

User Gets Stuck
      ↓
Request Help
      ↓
Another User Accepts
      ↓
Collaborative Room Created
      ↓
Helper Reviews and Edits Code
      ↓
Helper Sends Explanation
      ↓
Requester Reviews Solution
      ↓
Resolve Help or Ask Again

⚡ **Real-Time Communication**

Socket.io is used for:
- Code synchronization
- Room participation
- Online user tracking
- Real-time chat
- Collaboration events
- Help-request events
- Notifications
  
🔐 **Authentication**

CollabCode uses JWT-based authentication.
After successful login, a JWT token is generated and used for:
- Protected REST API requests
- Socket.io authentication
Passwords are hashed using bcryptjs before being stored in the database.

▶️ **Code Execution**

User code is executed using the Judge0 API.
The backend sends:
- Source code
- Programming language
- Input
- Test cases
Judge0 returns:
- Program output
- Compilation errors
- Runtime errors
- Execution status
- 
🗄️ **Database Collections**

users
problems
rooms
submissions
reviews
contributions
helprequests
notifications
roominvitations

💡 **Technical Highlights**

**Real-Time Code Synchronization**
Users inside the same coding room can see code changes in real time using Socket.io.

**Registered User Invitations**
Users can search for registered users and send collaboration invitations.
The invited user can:
- Accept the invitation
- Decline the invitation
- Join the room after acceptance

**Help Request System**
A user who gets stuck while solving a problem can request help.
Another user can accept the request, collaborate in the same room, and provide:
- Problem found
- Location of the issue
- Why the code was incorrect
- Changes made
- Solution explanation
- Test result
The requester can then resolve the help request or ask again.

**Notification System**
Notifications are generated for events such as:
- Help requests
- Help acceptance
- Solution completion
- Room invitations
- Invitation responses
- Reviews

🌐 **Deployment**

React Frontend
     │
     │ HTTPS + Socket.io
     ▼
Render Backend
     │
     ├─────────────► Judge0 API
     │
     ▼
MongoDB Atlas

Frontend
Deployed as a Render Static Site.
https://collabcode-project.onrender.com

Backend
Deployed as a Render Web Service.
https://collabcode-api-jok1.onrender.com

Database
MongoDB Atlas is used as the production cloud database.

Code Execution
Judge0 is used for executing user-submitted code.

🧩 **Challenges Solved**

- Real-time code synchronization
- Preventing duplicate Socket.io listeners
- Avoiding duplicate chat messages
- Tracking online users correctly
- JWT authentication for APIs and sockets
- MongoDB Atlas integration
- CORS configuration
- Production environment-variable setup
- Judge0 integration
- Collaboration invitation workflow
- Help-request and resolution workflow
- Real-time notification delivery
- Separate frontend and backend deployment

📚** What I Learned**

- Full-stack web development
- React component architecture
- REST API development
- Node.js and Express.js
- MongoDB and Mongoose
- JWT authentication
- WebSockets
- Socket.io
- Real-time application development
- Third-party API integration
- MongoDB Atlas
- Render deployment
- Environment-variable management
- Git and GitHub
- Production debugging

🔮 **Future Improvements**

- AI Coding Assistant
- Coding Contests
- More Coding Problems
- Advanced Leaderboard
- User Profiles
- Badges and Achievements
- Voice or Video Collaboration
- Advanced Contribution Analytics
- More Programming Languages
- Improved Performance and Scalability
  
👩‍💻 **Author**

Saniya Salunkhe
Computer Science & Engineering Student
GitHub:
https://github.com/saniya-salunkhe

📄 **License**

This project was developed for educational and academic purposes.
