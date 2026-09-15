import {
  io,
} from 'socket.io-client';


let socket =
  null;


// ============================================================
// GET SOCKET SERVER URL
// ============================================================
//
// Development:
// http://localhost:5000
//
// Production:
// VITE_SOCKET_URL from Render
//
// If only VITE_API_URL exists, remove "/api" automatically.
// ============================================================

const getSocketUrl =
  () => {

    if (
      import.meta.env
        .VITE_SOCKET_URL
    ) {

      return import.meta.env
        .VITE_SOCKET_URL;
    }


    if (
      import.meta.env
        .VITE_API_URL
    ) {

      return import.meta.env
        .VITE_API_URL
        .replace(
          /\/api\/?$/,
          ''
        );
    }


    return 'http://localhost:5000';
  };


// ============================================================
// CONNECT COLLABORATION SOCKET
// ============================================================

export const connectSocket =
  (token) => {

    // --------------------------------------------------------
    // REUSE EXISTING CONNECTED SOCKET
    // --------------------------------------------------------

    if (
      socket &&
      socket.connected
    ) {

      return socket;
    }


    // --------------------------------------------------------
    // CLEAN OLD SOCKET
    // --------------------------------------------------------

    if (socket) {

      socket.removeAllListeners();

      socket.disconnect();

      socket =
        null;
    }


    // --------------------------------------------------------
    // CREATE NEW SOCKET
    // --------------------------------------------------------

    socket =
      io(
        getSocketUrl(),
        {
          auth: {
            token,
          },

          transports: [
            'websocket',
            'polling',
          ],

          reconnection:
            true,

          reconnectionAttempts:
            Infinity,

          reconnectionDelay:
            1000,
        }
      );


    // --------------------------------------------------------
    // CONNECTION EVENTS
    // --------------------------------------------------------

    socket.on(
      'connect',
      () => {

        console.log(
          '🔌 Collaboration socket connected:',
          socket.id
        );
      }
    );


    socket.on(
      'disconnect',
      (
        reason
      ) => {

        console.log(
          '🔌 Collaboration socket disconnected:',
          reason
        );
      }
    );


    socket.on(
      'connect_error',
      (
        err
      ) => {

        console.error(
          'Collaboration socket connection error:',
          err.message
        );
      }
    );


    return socket;
  };


// ============================================================
// GET SOCKET
// ============================================================

export const getSocket =
  () =>
    socket;


// ============================================================
// DISCONNECT SOCKET
// ============================================================

export const disconnectSocket =
  () => {

    if (
      socket
    ) {

      socket.removeAllListeners();

      socket.disconnect();

      socket =
        null;
    }
  };