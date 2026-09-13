const Notification =
  require('../models/Notification');


// ============================================================
// CREATE NOTIFICATION
// ============================================================

const createNotification = async ({
  io,
  recipient,
  sender = null,
  type = 'general',
  title,
  message,
  link = '',
  metadata = {},
}) => {
  if (!recipient) {
    return null;
  }

  const notification =
    await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      metadata,
      isRead: false,
    });


  const populatedNotification =
    await Notification.findById(
      notification._id
    )
      .populate(
        'sender',
        'name avatarColor'
      );


  // ----------------------------------------------------------
  // REAL-TIME PRIVATE NOTIFICATION
  // ----------------------------------------------------------

  if (io) {
    io.to(
      `user:${recipient.toString()}`
    ).emit(
      'notification:new',
      populatedNotification
    );
  }


  return populatedNotification;
};


// ============================================================
// CREATE MANY NOTIFICATIONS
// ============================================================

const createManyNotifications = async ({
  io,
  recipients = [],
  sender = null,
  type = 'general',
  title,
  message,
  link = '',
  metadata = {},
}) => {
  const uniqueRecipients = [
    ...new Set(
      recipients
        .filter(Boolean)
        .map((id) =>
          id.toString()
        )
    ),
  ];


  const results =
    await Promise.allSettled(
      uniqueRecipients.map(
        (recipient) =>
          createNotification({
            io,
            recipient,
            sender,
            type,
            title,
            message,
            link,
            metadata,
          })
      )
    );


  return results;
};


module.exports = {
  createNotification,
  createManyNotifications,
};