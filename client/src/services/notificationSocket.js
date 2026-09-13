import {
  io,
} from 'socket.io-client';


let notificationSocket =
  null;


// ============================================================
// GET SOCKET SERVER URL
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
    if (
      notificationSocket &&
      notificationSocket.connected
    ) {
      return notificationSocket;
    }


    if (notificationSocket) {
      notificationSocket.disconnect();
    }


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


    return notificationSocket;
  };


// ============================================================
// GET SOCKET
// ============================================================

export const getNotificationSocket =
  () =>
    notificationSocket;


// ============================================================
// DISCONNECT
// ============================================================

export const disconnectNotificationSocket =
  () => {
    if (
      notificationSocket
    ) {
      notificationSocket.disconnect();

      notificationSocket =
        null;
    }
  };