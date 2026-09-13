const mongoose =
  require('mongoose');


const notificationSchema =
  new mongoose.Schema(
    {
      recipient: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,

        index:
          true,
      },

      sender: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        default:
          null,
      },

      type: {
        type:
          String,

        enum: [
          'help_requested',
          'help_accepted',
          'solution_sent',
          'help_resolved',
          'help_reopened',

          // Collaboration invitation
          'room_invitation',
          'room_invitation_accepted',
          'room_invitation_declined',

          'room_joined',
          'review_added',
          'general',
        ],

        default:
          'general',
      },

      title: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          150,
      },

      message: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          500,
      },

      link: {
        type:
          String,

        default:
          '',

        trim:
          true,
      },

      metadata: {
        type:
          mongoose.Schema.Types.Mixed,

        default:
          {},
      },

      isRead: {
        type:
          Boolean,

        default:
          false,
      },

      readAt: {
        type:
          Date,

        default:
          null,
      },
    },

    {
      timestamps:
        true,
    }
  );


notificationSchema.index({
  recipient:
    1,

  createdAt:
    -1,
});


module.exports =
  mongoose.model(
    'Notification',
    notificationSchema
  );