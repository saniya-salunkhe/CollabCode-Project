const RoomInvitation =
  require(
    '../models/RoomInvitation'
  );

const Room =
  require('../models/Room');

const User =
  require('../models/User');

const Contribution =
  require(
    '../models/Contribution'
  );

const {
  createNotification,
} =
  require(
    '../services/notificationService'
  );


// ============================================================
// SAFE NOTIFICATION
// ============================================================

async function notifySafely(
  options
) {
  try {
    await createNotification(
      options
    );
  } catch (err) {
    console.error(
      'Invitation notification error:',
      err.message
    );
  }
}


// ============================================================
// SEARCH COLLABCODE USERS
// ============================================================

exports.searchUsers =
  async (req, res) => {
    try {
      const query =
        String(
          req.query.q || ''
        ).trim();


      if (
        query.length < 2
      ) {
        return res.json(
          []
        );
      }


      // Escape regex special characters
      const escapedQuery =
        query.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );


      const regex =
        new RegExp(
          escapedQuery,
          'i'
        );


      const users =
        await User.find({
          _id: {
            $ne:
              req.user._id,
          },

          $or: [
            {
              name:
                regex,
            },

            {
              email:
                regex,
            },
          ],
        })
          .select(
            'name email avatarColor'
          )
          .limit(10);


      return res.json(
        users
      );


    } catch (err) {
      console.error(
        'Search users error:',
        err
      );


      return res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };


// ============================================================
// SEND ROOM INVITATION
// ============================================================

exports.inviteUser =
  async (req, res) => {
    try {
      const {
        userId,
      } =
        req.body;


      if (!userId) {
        return res
          .status(400)
          .json({
            message:
              'Select a user to invite',
          });
      }


      // --------------------------------------------------------
      // FIND ROOM
      // --------------------------------------------------------

      const room =
        await Room.findOne({
          roomCode:
            req.params.roomCode
              .toUpperCase(),
        }).populate(
          'problem',
          'title difficulty'
        );


      if (!room) {
        return res
          .status(404)
          .json({
            message:
              'Room not found',
          });
      }


      if (
        room.status !==
        'active'
      ) {
        return res
          .status(400)
          .json({
            message:
              'You cannot invite users to a completed room',
          });
      }


      // --------------------------------------------------------
      // CURRENT USER MUST BE ROOM MEMBER
      // --------------------------------------------------------

      const currentUserIsMember =
        room.members.some(
          (member) =>
            member.user
              .toString() ===
            req.user._id
              .toString()
        );


      if (
        !currentUserIsMember
      ) {
        return res
          .status(403)
          .json({
            message:
              'Only room members can invite collaborators',
          });
      }


      // --------------------------------------------------------
      // FIND USER TO INVITE
      // --------------------------------------------------------

      const invitedUser =
        await User.findById(
          userId
        ).select(
          'name email avatarColor'
        );


      if (!invitedUser) {
        return res
          .status(404)
          .json({
            message:
              'User not found',
          });
      }


      // Cannot invite yourself
      if (
        invitedUser._id
          .toString() ===
        req.user._id
          .toString()
      ) {
        return res
          .status(400)
          .json({
            message:
              'You cannot invite yourself',
          });
      }


      // --------------------------------------------------------
      // USER ALREADY MEMBER
      // --------------------------------------------------------

      const alreadyMember =
        room.members.some(
          (member) =>
            member.user
              .toString() ===
            invitedUser._id
              .toString()
        );


      if (alreadyMember) {
        return res
          .status(400)
          .json({
            message:
              `${invitedUser.name} is already a member of this room`,
          });
      }


      // --------------------------------------------------------
      // PREVENT DUPLICATE PENDING INVITE
      // --------------------------------------------------------

      const existingInvitation =
        await RoomInvitation.findOne({
          room:
            room._id,

          invitedUser:
            invitedUser._id,

          status:
            'pending',
        });


      if (existingInvitation) {
        return res
          .status(400)
          .json({
            message:
              `${invitedUser.name} already has a pending invitation`,
          });
      }


      // --------------------------------------------------------
      // CREATE INVITATION
      // --------------------------------------------------------

      const invitation =
        await RoomInvitation.create({
          room:
            room._id,

          roomCode:
            room.roomCode,

          invitedBy:
            req.user._id,

          invitedUser:
            invitedUser._id,

          status:
            'pending',
        });


      const populatedInvitation =
        await RoomInvitation
          .findById(
            invitation._id
          )
          .populate(
            'invitedBy',
            'name email avatarColor'
          )
          .populate(
            'invitedUser',
            'name email avatarColor'
          )
          .populate({
            path:
              'room',

            populate: {
              path:
                'problem',

              select:
                'title difficulty',
            },
          });


      // --------------------------------------------------------
      // NOTIFICATION
      // --------------------------------------------------------

      const io =
        req.app.get(
          'io'
        );


      await notifySafely({
        io,

        recipient:
          invitedUser._id,

        sender:
          req.user._id,

        type:
          'room_invitation',

        title:
          'Collaboration Invitation',

        message:
          `${req.user.name} invited you to collaborate on ${room.problem?.title || 'a coding problem'}.`,

        link:
          '/invitations',

        metadata: {
          invitationId:
            invitation._id,

          roomCode:
            room.roomCode,

          problemId:
            room.problem?._id,
        },
      });


      return res
        .status(201)
        .json({
          message:
            `Invitation sent to ${invitedUser.name}`,

          invitation:
            populatedInvitation,

          roomCode:
            room.roomCode,
        });


    } catch (err) {
      console.error(
        'Invite user error:',
        err
      );


      return res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };


// ============================================================
// GET MY INVITATIONS
// ============================================================

exports.getMyInvitations =
  async (req, res) => {
    try {
      const invitations =
        await RoomInvitation.find({
          invitedUser:
            req.user._id,
        })
          .populate(
            'invitedBy',
            'name email avatarColor'
          )
          .populate({
            path:
              'room',

            select:
              'roomCode currentLanguage status problem createdAt',

            populate: {
              path:
                'problem',

              select:
                'title difficulty slug',
            },
          })
          .sort({
            createdAt:
              -1,
          })
          .limit(50);


      return res.json(
        invitations
      );


    } catch (err) {
      console.error(
        'Get invitations error:',
        err
      );


      return res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };


// ============================================================
// ACCEPT INVITATION
// ============================================================

exports.acceptInvitation =
  async (req, res) => {
    try {
      const invitation =
        await RoomInvitation
          .findOne({
            _id:
              req.params.id,

            invitedUser:
              req.user._id,

            status:
              'pending',
          })
          .populate(
            'invitedBy',
            'name email avatarColor'
          );


      if (!invitation) {
        return res
          .status(404)
          .json({
            message:
              'Pending invitation not found',
          });
      }


      const room =
        await Room.findById(
          invitation.room
        ).populate(
          'problem',
          'title difficulty'
        );


      if (!room) {
        return res
          .status(404)
          .json({
            message:
              'The collaboration room no longer exists',
          });
      }


      if (
        room.status !==
        'active'
      ) {
        return res
          .status(400)
          .json({
            message:
              'This collaboration room is no longer active',
          });
      }


      // --------------------------------------------------------
      // ADD USER TO ROOM ONLY AFTER ACCEPTING
      // --------------------------------------------------------

      const alreadyMember =
        room.members.some(
          (member) =>
            member.user
              .toString() ===
            req.user._id
              .toString()
        );


      if (!alreadyMember) {
        room.members.push({
          user:
            req.user._id,

          name:
            req.user.name,

          joinedAt:
            new Date(),
        });


        await room.save();
      }


      // --------------------------------------------------------
      // CONTRIBUTION RECORD
      // --------------------------------------------------------

      await Contribution.findOneAndUpdate(
        {
          room:
            room._id,

          user:
            req.user._id,
        },

        {
          $setOnInsert: {
            room:
              room._id,

            roomCode:
              room.roomCode,

            user:
              req.user._id,

            userName:
              req.user.name,
          },
        },

        {
          upsert:
            true,

          new:
            true,

          setDefaultsOnInsert:
            true,
        }
      );


      // --------------------------------------------------------
      // ACCEPT
      // --------------------------------------------------------

      invitation.status =
        'accepted';

      invitation.respondedAt =
        new Date();


      await invitation.save();


      // --------------------------------------------------------
      // NOTIFY INVITER
      // --------------------------------------------------------

      const io =
        req.app.get(
          'io'
        );


      await notifySafely({
        io,

        recipient:
          invitation.invitedBy._id,

        sender:
          req.user._id,

        type:
          'room_invitation_accepted',

        title:
          'Invitation Accepted',

        message:
          `${req.user.name} accepted your collaboration invitation for ${room.problem?.title || 'the coding room'}.`,

        link:
          `/room/${room.roomCode}`,

        metadata: {
          invitationId:
            invitation._id,

          roomCode:
            room.roomCode,

          problemId:
            room.problem?._id,
        },
      });


      return res.json({
        message:
          'Invitation accepted successfully',

        status:
          'accepted',

        roomCode:
          room.roomCode,
      });


    } catch (err) {
      console.error(
        'Accept invitation error:',
        err
      );


      return res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };


// ============================================================
// DECLINE INVITATION
// ============================================================

exports.declineInvitation =
  async (req, res) => {
    try {
      const invitation =
        await RoomInvitation
          .findOne({
            _id:
              req.params.id,

            invitedUser:
              req.user._id,

            status:
              'pending',
          })
          .populate(
            'invitedBy',
            'name email avatarColor'
          );


      if (!invitation) {
        return res
          .status(404)
          .json({
            message:
              'Pending invitation not found',
          });
      }


      const room =
        await Room.findById(
          invitation.room
        ).populate(
          'problem',
          'title'
        );


      invitation.status =
        'declined';

      invitation.respondedAt =
        new Date();


      await invitation.save();


      // --------------------------------------------------------
      // NOTIFY INVITER
      // --------------------------------------------------------

      const io =
        req.app.get(
          'io'
        );


      await notifySafely({
        io,

        recipient:
          invitation.invitedBy._id,

        sender:
          req.user._id,

        type:
          'room_invitation_declined',

        title:
          'Invitation Declined',

        message:
          `${req.user.name} declined your collaboration invitation${room?.problem?.title ? ` for ${room.problem.title}` : ''}.`,

        link:
          '/my-rooms',

        metadata: {
          invitationId:
            invitation._id,

          roomCode:
            invitation.roomCode,
        },
      });


      return res.json({
        message:
          'Invitation declined',

        status:
          'declined',
      });


    } catch (err) {
      console.error(
        'Decline invitation error:',
        err
      );


      return res
        .status(500)
        .json({
          message:
            err.message,
        });
    }
  };