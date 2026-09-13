const mongoose = require('mongoose');

const roomInvitationSchema =
  new mongoose.Schema(
    {
      room: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'Room',

        required:
          true,
      },

      roomCode: {
        type:
          String,

        required:
          true,

        uppercase:
          true,

        trim:
          true,
      },

      invitedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,
      },

      invitedUser: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          'User',

        required:
          true,
      },

      status: {
        type:
          String,

        enum: [
          'pending',
          'accepted',
          'declined',
          'cancelled',
        ],

        default:
          'pending',
      },

      respondedAt: {
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


roomInvitationSchema.index({
  invitedUser:
    1,

  status:
    1,

  createdAt:
    -1,
});


roomInvitationSchema.index({
  room:
    1,

  invitedUser:
    1,
});


module.exports =
  mongoose.model(
    'RoomInvitation',
    roomInvitationSchema
  );