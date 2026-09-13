const Notification =
  require('../models/Notification');


// ============================================================
// GET MY NOTIFICATIONS
// ============================================================

exports.getMyNotifications =
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          recipient:
            req.user._id,
        })
          .populate(
            'sender',
            'name avatarColor'
          )
          .sort({
            createdAt: -1,
          })
          .limit(50);


      return res.json(
        notifications
      );

    } catch (err) {
      console.error(
        'Get notifications error:',
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };


// ============================================================
// GET UNREAD COUNT
// ============================================================

exports.getUnreadCount =
  async (req, res) => {
    try {
      const count =
        await Notification.countDocuments({
          recipient:
            req.user._id,

          isRead:
            false,
        });


      return res.json({
        count,
      });

    } catch (err) {
      console.error(
        'Get unread count error:',
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };


// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

exports.markAsRead =
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params.id,

            recipient:
              req.user._id,
          },

          {
            $set: {
              isRead:
                true,

              readAt:
                new Date(),
            },
          },

          {
            new: true,
          }
        );


      if (!notification) {
        return res.status(404).json({
          message:
            'Notification not found',
        });
      }


      return res.json(
        notification
      );

    } catch (err) {
      console.error(
        'Mark notification read error:',
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };


// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

exports.markAllAsRead =
  async (req, res) => {
    try {
      await Notification.updateMany(
        {
          recipient:
            req.user._id,

          isRead:
            false,
        },

        {
          $set: {
            isRead:
              true,

            readAt:
              new Date(),
          },
        }
      );


      return res.json({
        message:
          'All notifications marked as read',
      });

    } catch (err) {
      console.error(
        'Mark all notifications error:',
        err
      );

      return res.status(500).json({
        message:
          err.message,
      });
    }
  };