require('dotenv').config();

const express =
  require('express');

const cors =
  require('cors');

const http =
  require('http');

const {
  Server,
} =
  require('socket.io');


const connectDB =
  require('./config/db');

const {
  errorHandler,
  notFound,
} =
  require('./middleware/error');

const {
  initSockets,
} =
  require('./sockets/socketHandler');

const {
  initNotificationSocket,
} =
  require('./sockets/notificationSocket');


// ============================================================
// ROUTES
// ============================================================

const authRoutes =
  require('./routes/authRoutes');

const problemRoutes =
  require('./routes/problemRoutes');

const roomRoutes =
  require('./routes/roomRoutes');

const submissionRoutes =
  require('./routes/submissionRoutes');

const reviewRoutes =
  require('./routes/reviewRoutes');

const helpRequestRoutes =
  require('./routes/helpRequestRoutes');

const notificationRoutes =
  require('./routes/notificationRoutes');

// NEW
const roomInvitationRoutes =
  require(
    './routes/roomInvitationRoutes'
  );


// ============================================================
// EXPRESS APP
// ============================================================

const app =
  express();

const server =
  http.createServer(
    app
  );


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:5173',

    credentials:
      true,
  })
);


app.use(
  express.json({
    limit:
      '10mb',
  })
);


app.use(
  express.urlencoded({
    extended:
      true,
  })
);


// ============================================================
// HEALTH
// ============================================================

app.get(
  '/api/health',

  (req, res) => {
    res.json({
      status:
        'ok',

      service:
        'CollabCode API',

      timestamp:
        new Date()
          .toISOString(),
    });
  }
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);


app.use(
  '/api/problems',
  problemRoutes
);


app.use(
  '/api/rooms',
  roomRoutes
);


app.use(
  '/api/submissions',
  submissionRoutes
);


app.use(
  '/api/reviews',
  reviewRoutes
);


app.use(
  '/api/help-requests',
  helpRequestRoutes
);


app.use(
  '/api/notifications',
  notificationRoutes
);


// NEW INVITATIONS
app.use(
  '/api/room-invitations',
  roomInvitationRoutes
);


// ============================================================
// SOCKET.IO
// ============================================================

const io =
  new Server(
    server,
    {
      cors: {
        origin:
          process.env.CLIENT_URL ||
          'http://localhost:5173',

        methods: [
          'GET',
          'POST',
        ],

        credentials:
          true,
      },
    }
  );


app.set(
  'io',
  io
);


// Collaboration socket
initSockets(
  io
);


// Notification socket
initNotificationSocket(
  io
);


// ============================================================
// ERROR HANDLING
// ============================================================

app.use(
  notFound
);

app.use(
  errorHandler
);


// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT ||
  5000;


(async () => {
  try {
    await connectDB();


    server.listen(
      PORT,

      () => {
        console.log(
          `🚀 CollabCode server running on port ${PORT}`
        );

        console.log(
          `API: http://localhost:${PORT}/api/health`
        );

        console.log(
          `Socket: ws://localhost:${PORT}`
        );

        console.log(
          `Help: http://localhost:${PORT}/api/help-requests`
        );

        console.log(
          `Notifications: http://localhost:${PORT}/api/notifications`
        );

        console.log(
          `Invitations: http://localhost:${PORT}/api/room-invitations`
        );
      }
    );


  } catch (err) {
    console.error(
      '❌ Failed to start server:',
      err
    );

    process.exit(
      1
    );
  }
})();


module.exports = {
  app,
  server,
  io,
};