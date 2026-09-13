const jwt =
  require('jsonwebtoken');

const User =
  require('../models/User');


// ============================================================
// NOTIFICATION SOCKET
//
// Every logged-in user joins:
//
// user:<USER_ID>
//
// Example:
// user:68c1abc123...
// ============================================================

function initNotificationSocket(io) {
  io.on(
    'connection',
    async (socket) => {
      try {
        let token =
          socket.handshake
            ?.auth
            ?.token;


        // ------------------------------------------------------
        // OPTIONAL AUTH HEADER FALLBACK
        // ------------------------------------------------------

        if (!token) {
          const authHeader =
            socket.handshake
              ?.headers
              ?.authorization;


          if (
            authHeader &&
            authHeader.startsWith(
              'Bearer '
            )
          ) {
            token =
              authHeader.substring(
                7
              );
          }
        }


        if (!token) {
          return;
        }


        token =
          token.replace(
            /^Bearer\s+/i,
            ''
          );


        // ------------------------------------------------------
        // VERIFY JWT
        // ------------------------------------------------------

        const decoded =
          jwt.verify(
            token,
            process.env.JWT_SECRET
          );


        const userId =
          decoded.id ||
          decoded.userId ||
          decoded._id;


        if (!userId) {
          console.log(
            'Notification socket: user id missing in token'
          );

          return;
        }


        // ------------------------------------------------------
        // FIND USER
        // ------------------------------------------------------

        const user =
          await User.findById(
            userId
          ).select(
            '_id name'
          );


        if (!user) {
          return;
        }


        // ------------------------------------------------------
        // JOIN PRIVATE NOTIFICATION ROOM
        // ------------------------------------------------------

        const privateRoom =
          `user:${user._id.toString()}`;


        socket.join(
          privateRoom
        );


        console.log(
          `🔔 Notification socket connected: ${user.name}`
        );


        socket.on(
          'disconnect',
          () => {
            console.log(
              `🔕 Notification socket disconnected: ${user.name}`
            );
          }
        );


      } catch (err) {
        // Do not break your existing collaboration socket.
        console.log(
          'Notification socket authentication skipped:',
          err.message
        );
      }
    }
  );
}


module.exports = {
  initNotificationSocket,
};