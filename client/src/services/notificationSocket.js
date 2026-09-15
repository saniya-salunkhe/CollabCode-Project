import {
  io,
} from 'socket.io-client';


let notificationSocket =
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
// If only VITE_API_URL exists,
// automatically remove "/api".
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
// CONNECT NOTIFICATION SOCKET
// ============================================================

export const connectNotificationSocket =
  (token) => {

    // --------------------------------------------------------
    // REUSE CONNECTED SOCKET
    // --------------------------------------------------------

    if (
      notificationSocket &&
      notificationSocket.connected
    ) {

      return notificationSocket;
    }


    // --------------------------------------------------------
    // CLEAN OLD SOCKET
    // --------------------------------------------------------

    if (
      notificationSocket
    ) {

      notificationSocket
        .removeAllListeners();

      notificationSocket
        .disconnect();

      notificationSocket =
        null;
    }


    // --------------------------------------------------------
    // CREATE SOCKET
    // --------------------------------------------------------

    notificationSocket =
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

    notificationSocket.on(
      'connect',
      () => {

        console.log(
          '🔔 Notification socket connected:',
          notificationSocket.id
        );
      }
    );


    notificationSocket.on(
      'disconnect',
      (
        reason
      ) => {

        console.log(
          '🔕 Notification socket disconnected:',
          reason
        );
      }
    );


    notificationSocket.on(
      'connect_error',
      (
        err
      ) => {

        console.error(
          'Notification socket connection error:',
          err.message
        );
      }
    );


    return notificationSocket;
  };


// ============================================================
// GET SOCKET
// ============================================================

export const getNotificationSocket =
  () =>
    notificationSocket;


// ============================================================
// DISCONNECT SOCKET
// ============================================================

export const disconnectNotificationSocket =
  () => {

    if (
      notificationSocket
    ) {

      notificationSocket
        .removeAllListeners();

      notificationSocket
        .disconnect();

      notificationSocket =
        null;
    }
  };