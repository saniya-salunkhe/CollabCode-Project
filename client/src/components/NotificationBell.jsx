import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  notificationService,
} from '../services';

import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from '../services/notificationSocket';

import {
  toast,
} from './ToastContainer';

import {
  useAuth,
} from '../contexts/AuthContext';


export default function NotificationBell() {
  const navigate =
    useNavigate();

  const {
    user,
  } =
    useAuth();


  const [
    notifications,
    setNotifications,
  ] =
    useState([]);


  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);


  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    processing,
    setProcessing,
  ] =
    useState(false);


  const containerRef =
    useRef(
      null
    );


  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  const loadNotifications =
    async () => {
      try {
        const {
          data,
        } =
          await notificationService
            .getMine();


        const list =
          Array.isArray(data)
            ? data
            : [];


        setNotifications(
          list
        );


        setUnreadCount(
          list.filter(
            (item) =>
              !item.isRead
          ).length
        );


      } catch (err) {
        console.error(
          'Load notifications error:',
          err
        );
      }
    };


  // ============================================================
  // SOCKET
  // ============================================================

  useEffect(() => {
    if (!user) {
      return;
    }


    loadNotifications();


    const token =
      localStorage.getItem(
        'collabcode_token'
      );


    if (!token) {
      console.log(
        'Notification socket token not found'
      );

      return;
    }


    const socket =
      connectNotificationSocket(
        token
      );


    const handleNewNotification =
      (notification) => {
        if (!notification) {
          return;
        }


        setNotifications(
          (previous) => {
            const alreadyExists =
              previous.some(
                (item) =>
                  item._id ===
                  notification._id
              );


            if (
              alreadyExists
            ) {
              return previous;
            }


            return [
              notification,
              ...previous,
            ].slice(
              0,
              50
            );
          }
        );


        if (
          !notification.isRead
        ) {
          setUnreadCount(
            (previous) =>
              previous + 1
          );
        }


        toast.info(
          notification.message ||
          notification.title ||
          'New notification'
        );
      };


    socket.on(
      'notification:new',
      handleNewNotification
    );


    return () => {
      socket.off(
        'notification:new',
        handleNewNotification
      );

      disconnectNotificationSocket();
    };

  }, [user?._id]);


  // ============================================================
  // BACKUP REFRESH
  //
  // Handles temporarily disconnected sockets.
  // ============================================================

  useEffect(() => {
    if (!user) {
      return;
    }


    const interval =
      setInterval(
        () => {
          loadNotifications();
        },
        20000
      );


    return () => {
      clearInterval(
        interval
      );
    };

  }, [user?._id]);


  // ============================================================
  // CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target
          )
        ) {
          setOpen(
            false
          );
        }
      };


    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );


    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };

  }, []);


  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime =
    (date) => {
      if (!date) {
        return '';
      }


      const created =
        new Date(
          date
        );


      if (
        Number.isNaN(
          created.getTime()
        )
      ) {
        return '';
      }


      const now =
        new Date();


      const difference =
        Math.floor(
          (
            now.getTime() -
            created.getTime()
          ) /
          1000
        );


      if (
        difference <
        60
      ) {
        return 'Just now';
      }


      if (
        difference <
        3600
      ) {
        return `${Math.floor(
          difference /
          60
        )} min ago`;
      }


      if (
        difference <
        86400
      ) {
        return `${Math.floor(
          difference /
          3600
        )} hr ago`;
      }


      return created
        .toLocaleDateString();
    };


  // ============================================================
  // ICON
  // ============================================================

  const getIcon =
    (type) => {
      switch (type) {
        case 'help_requested':
          return '🆘';

        case 'help_accepted':
          return '🤝';

        case 'solution_sent':
          return '✅';

        case 'help_resolved':
          return '🎉';

        case 'help_reopened':
          return '🆘';

        case 'room_joined':
          return '👤';

        case 'review_added':
          return '💬';

        case 'room_invitation':
          return '👥';

        case 'room_invitation_accepted':
          return '✅';

        case 'room_invitation_declined':
          return '❌';

        default:
          return '🔔';
      }
    };


  // ============================================================
  // CLICK NOTIFICATION
  // ============================================================

  const handleNotificationClick =
    async (
      notification
    ) => {
      try {
        if (
          !notification.isRead
        ) {
          await notificationService
            .markAsRead(
              notification._id
            );


          setNotifications(
            (previous) =>
              previous.map(
                (item) =>
                  item._id ===
                  notification._id
                    ? {
                        ...item,
                        isRead:
                          true,
                      }
                    : item
              )
          );


          setUnreadCount(
            (previous) =>
              Math.max(
                previous - 1,
                0
              )
          );
        }


        setOpen(
          false
        );


        if (
          notification.link
        ) {
          navigate(
            notification.link
          );
        }


      } catch (err) {
        console.error(
          'Notification click error:',
          err
        );
      }
    };


  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const handleMarkAllRead =
    async () => {
      try {
        setProcessing(
          true
        );


        await notificationService
          .markAllAsRead();


        setNotifications(
          (previous) =>
            previous.map(
              (item) => ({
                ...item,
                isRead:
                  true,
              })
            )
        );


        setUnreadCount(
          0
        );


      } catch (err) {
        console.error(
          'Mark all read error:',
          err
        );


        toast.error(
          err.response?.data?.message ||
          'Failed to mark notifications as read'
        );


      } finally {
        setProcessing(
          false
        );
      }
    };


  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      ref={
        containerRef
      }

      style={{
        position:
          'relative',
      }}
    >

      {/* BELL */}

      <button
        type="button"

        className="btn btn-ghost btn-sm"

        title="Notifications"

        aria-label="Notifications"

        onClick={() => {
          setOpen(
            (previous) =>
              !previous
          );


          if (!open) {
            loadNotifications();
          }
        }}

        style={{
          position:
            'relative',

          fontSize:
            '19px',

          minWidth:
            '38px',
        }}
      >

        🔔


        {unreadCount >
          0 && (

          <span
            style={{
              position:
                'absolute',

              top:
                '-5px',

              right:
                '-5px',

              minWidth:
                '18px',

              height:
                '18px',

              padding:
                '0 5px',

              borderRadius:
                '10px',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              background:
                '#ef4444',

              color:
                '#ffffff',

              fontSize:
                '10px',

              fontWeight:
                700,
            }}
          >

            {unreadCount >
            99
              ? '99+'
              : unreadCount}

          </span>
        )}

      </button>


      {/* DROPDOWN */}

      {open && (
        <div
          style={{
            position:
              'absolute',

            right:
              0,

            top:
              '48px',

            width:
              '380px',

            maxWidth:
              '90vw',

            maxHeight:
              '520px',

            overflowY:
              'auto',

            background:
              '#1e293b',

            border:
              '1px solid #334155',

            borderRadius:
              '12px',

            boxShadow:
              '0 15px 40px rgba(0, 0, 0, 0.4)',

            zIndex:
              9999,
          }}
        >

          {/* HEADER */}

          <div
            style={{
              display:
                'flex',

              justifyContent:
                'space-between',

              alignItems:
                'center',

              gap:
                '12px',

              padding:
                '14px 16px',

              borderBottom:
                '1px solid #334155',
            }}
          >

            <strong>
              🔔 Notifications
            </strong>


            {unreadCount >
              0 && (

              <button
                type="button"

                className="btn btn-ghost btn-sm"

                onClick={
                  handleMarkAllRead
                }

                disabled={
                  processing
                }
              >

                {processing
                  ? 'Saving...'
                  : 'Mark all read'}

              </button>

            )}

          </div>


          {/* EMPTY STATE */}

          {notifications.length ===
            0 && (

            <div
              style={{
                padding:
                  '32px 20px',

                textAlign:
                  'center',
              }}

              className="text-secondary"
            >

              <div
                style={{
                  fontSize:
                    '28px',

                  marginBottom:
                    '8px',
                }}
              >
                🔔
              </div>

              No notifications yet.

            </div>

          )}


          {/* ITEMS */}

          {notifications.map(
            (
              notification
            ) => (

              <div
                key={
                  notification._id
                }

                role="button"

                tabIndex={
                  0
                }

                onClick={() =>
                  handleNotificationClick(
                    notification
                  )
                }

                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      'Enter' ||
                    event.key ===
                      ' '
                  ) {
                    handleNotificationClick(
                      notification
                    );
                  }
                }}

                style={{
                  padding:
                    '14px 16px',

                  cursor:
                    'pointer',

                  borderBottom:
                    '1px solid #334155',

                  background:
                    notification.isRead
                      ? 'transparent'
                      : 'rgba(99, 102, 241, 0.13)',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',

                    alignItems:
                      'flex-start',

                    gap:
                      '10px',
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        '20px',

                      lineHeight:
                        1.3,
                    }}
                  >

                    {
                      getIcon(
                        notification.type
                      )
                    }

                  </div>


                  <div
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,
                    }}
                  >

                    <div
                      style={{
                        fontWeight:
                          notification.isRead
                            ? 500
                            : 700,
                      }}
                    >

                      {
                        notification.title
                      }

                    </div>


                    <div
                      className="text-secondary text-sm"

                      style={{
                        marginTop:
                          '4px',

                        lineHeight:
                          1.45,
                      }}
                    >

                      {
                        notification.message
                      }

                    </div>


                    <div
                      className="text-muted text-sm"

                      style={{
                        marginTop:
                          '6px',
                      }}
                    >

                      {
                        formatTime(
                          notification.createdAt
                        )
                      }

                    </div>

                  </div>


                  {!notification.isRead && (
                    <div
                      style={{
                        width:
                          '8px',

                        height:
                          '8px',

                        borderRadius:
                          '50%',

                        background:
                          '#6366f1',

                        marginTop:
                          '5px',

                        flexShrink:
                          0,
                      }}
                    />
                  )}

                </div>

              </div>

            )
          )}

        </div>
      )}

    </div>
  );
}