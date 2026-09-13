const HelpRequest =
  require('../models/HelpRequest');

const Problem =
  require('../models/Problem');

const Room =
  require('../models/Room');

const User =
  require('../models/User');

const Contribution =
  require('../models/Contribution');

const {
  createNotification,
  createManyNotifications,
} =
  require('../services/notificationService');


// ============================================================
// SAFE PROBLEM FIELDS
// ============================================================

const SAFE_PROBLEM_FIELDS =
  'title slug difficulty description examples constraints tags';


// ============================================================
// GENERATE UNIQUE ROOM CODE
// ============================================================

function generateRoomCode() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code =
    'CC';

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    code +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];
  }

  return code;
}


// ============================================================
// SAFE NOTIFICATION
//
// Notification failure must NOT break help functionality.
// ============================================================

async function sendNotificationSafely(
  options
) {
  try {
    return await createNotification(
      options
    );

  } catch (err) {
    console.error(
      'Notification creation error:',
      err.message
    );

    return null;
  }
}


async function sendManyNotificationsSafely(
  options
) {
  try {
    return await createManyNotifications(
      options
    );

  } catch (err) {
    console.error(
      'Multiple notification creation error:',
      err.message
    );

    return [];
  }
}


// ============================================================
// CREATE HELP REQUEST
// ============================================================

exports.createHelpRequest =
  async (req, res) => {
    try {
      const {
        problemId,
        language,
        currentCode,
        message,
      } =
        req.body;


      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!problemId) {
        return res
          .status(400)
          .json({
            message:
              'Problem ID is required',
          });
      }


      if (!language) {
        return res
          .status(400)
          .json({
            message:
              'Programming language is required',
          });
      }


      if (
        !currentCode ||
        !currentCode.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Write some code before requesting help',
          });
      }


      if (
        !message ||
        !message.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain what you need help with',
          });
      }


      // --------------------------------------------------------
      // CHECK PROBLEM
      // --------------------------------------------------------

      const problem =
        await Problem.findById(
          problemId
        );


      if (!problem) {
        return res
          .status(404)
          .json({
            message:
              'Problem not found',
          });
      }


      // --------------------------------------------------------
      // PREVENT DUPLICATE ACTIVE REQUEST
      // --------------------------------------------------------

      const existingRequest =
        await HelpRequest.findOne({
          requester:
            req.user._id,

          problem:
            problemId,

          status: {
            $in: [
              'open',
              'accepted',
              'solution_sent',
            ],
          },
        });


      if (existingRequest) {
        let errorMessage =
          'You already have an active help request for this problem.';


        if (
          existingRequest.status ===
          'accepted'
        ) {
          errorMessage =
            'A helper is already working on this problem.';
        }


        if (
          existingRequest.status ===
          'solution_sent'
        ) {
          errorMessage =
            'A solution has already been sent. Open My Help to view it, resolve it, or ask again.';
        }


        return res
          .status(400)
          .json({
            message:
              errorMessage,
          });
      }


      // --------------------------------------------------------
      // CREATE REQUEST
      // --------------------------------------------------------

      const request =
        await HelpRequest.create({
          requester:
            req.user._id,

          problem:
            problemId,

          language,

          currentCode,

          message:
            message.trim(),

          status:
            'open',
        });


      // --------------------------------------------------------
      // POPULATE
      // --------------------------------------------------------

      const populatedRequest =
        await HelpRequest.findById(
          request._id
        )
          .populate(
            'requester',
            'name email avatarColor'
          )
          .populate(
            'problem',
            'title slug difficulty tags'
          );


      const io =
        req.app.get(
          'io'
        );


      // --------------------------------------------------------
      // KEEP EXISTING BROADCAST FOR HELP REQUEST PAGE
      // --------------------------------------------------------

      if (io) {
        io.emit(
          'help-request-created',
          populatedRequest
        );
      }


      // --------------------------------------------------------
      // NEW NOTIFICATION TO OTHER USERS
      // --------------------------------------------------------

      const otherUsers =
        await User.find({
          _id: {
            $ne:
              req.user._id,
          },
        }).select(
          '_id'
        );


      await sendManyNotificationsSafely({
        io,

        recipients:
          otherUsers.map(
            (user) =>
              user._id
          ),

        sender:
          req.user._id,

        type:
          'help_requested',

        title:
          'New Help Request',

        message:
          `${req.user.name} needs help with ${problem.title}.`,

        link:
          '/help-requests',

        metadata: {
          helpRequestId:
            request._id,

          problemId:
            problem._id,

          language,
        },
      });


      return res
        .status(201)
        .json(
          populatedRequest
        );


    } catch (err) {
      console.error(
        'Create help request error:',
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
// GET OPEN HELP REQUESTS
// ============================================================

exports.getOpenHelpRequests =
  async (req, res) => {
    try {
      const requests =
        await HelpRequest.find({
          status:
            'open',

          requester: {
            $ne:
              req.user._id,
          },
        })
          .populate(
            'requester',
            'name email avatarColor'
          )
          .populate(
            'problem',
            'title slug difficulty tags'
          )
          .sort({
            createdAt:
              -1,
          });


      return res.json(
        requests
      );


    } catch (err) {
      console.error(
        'Get help requests error:',
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
// ACCEPT HELP REQUEST
// ============================================================

exports.acceptHelpRequest =
  async (req, res) => {
    let claimedRequest =
      null;

    let createdRoom =
      null;


    try {
      // --------------------------------------------------------
      // FIND REQUEST
      // --------------------------------------------------------

      const helpRequest =
        await HelpRequest.findById(
          req.params.id
        );


      if (!helpRequest) {
        return res
          .status(404)
          .json({
            message:
              'Help request not found',
          });
      }


      if (
        helpRequest.status !==
        'open'
      ) {
        return res
          .status(400)
          .json({
            message:
              'This help request is no longer available',
          });
      }


      // --------------------------------------------------------
      // CANNOT ACCEPT OWN REQUEST
      // --------------------------------------------------------

      if (
        helpRequest.requester.toString() ===
        req.user._id.toString()
      ) {
        return res
          .status(400)
          .json({
            message:
              'You cannot accept your own help request',
          });
      }


      // --------------------------------------------------------
      // PROBLEM
      // --------------------------------------------------------

      const problem =
        await Problem.findById(
          helpRequest.problem
        );


      if (!problem) {
        return res
          .status(404)
          .json({
            message:
              'The problem associated with this help request no longer exists',
          });
      }


      // --------------------------------------------------------
      // REQUESTER USER
      // --------------------------------------------------------

      const requesterUser =
        await User.findById(
          helpRequest.requester
        ).select(
          'name email avatarColor'
        );


      if (!requesterUser) {
        return res
          .status(404)
          .json({
            message:
              'The requester account no longer exists',
          });
      }


      // --------------------------------------------------------
      // ATOMICALLY CLAIM
      // --------------------------------------------------------

      claimedRequest =
        await HelpRequest.findOneAndUpdate(
          {
            _id:
              helpRequest._id,

            status:
              'open',
          },

          {
            $set: {
              status:
                'accepted',

              helper:
                req.user._id,
            },
          },

          {
            new:
              true,
          }
        );


      if (!claimedRequest) {
        return res
          .status(409)
          .json({
            message:
              'Another student already accepted this help request.',
          });
      }


      // --------------------------------------------------------
      // UNIQUE ROOM CODE
      // --------------------------------------------------------

      let roomCode;

      let roomExists =
        true;


      while (roomExists) {
        roomCode =
          generateRoomCode();

        roomExists =
          await Room.exists({
            roomCode,
          });
      }


      // --------------------------------------------------------
      // CREATE HELP ROOM
      // --------------------------------------------------------

      try {
        createdRoom =
          await Room.create({
            roomCode,

            problem:
              claimedRequest.problem,

            createdBy:
              claimedRequest.requester,

            members: [
              {
                user:
                  requesterUser._id,

                name:
                  requesterUser.name,
              },

              {
                user:
                  req.user._id,

                name:
                  req.user.name,
              },
            ],

            currentLanguage:
              claimedRequest.language,

            currentCode:
              claimedRequest.currentCode,

            status:
              'active',
          });


        // ------------------------------------------------------
        // REQUESTER CONTRIBUTION
        // ------------------------------------------------------

        await Contribution.findOneAndUpdate(
          {
            room:
              createdRoom._id,

            user:
              requesterUser._id,
          },

          {
            $setOnInsert: {
              room:
                createdRoom._id,

              roomCode:
                createdRoom.roomCode,

              user:
                requesterUser._id,

              userName:
                requesterUser.name,
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


        // ------------------------------------------------------
        // HELPER CONTRIBUTION
        // ------------------------------------------------------

        await Contribution.findOneAndUpdate(
          {
            room:
              createdRoom._id,

            user:
              req.user._id,
          },

          {
            $setOnInsert: {
              room:
                createdRoom._id,

              roomCode:
                createdRoom.roomCode,

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


        claimedRequest.room =
          createdRoom._id;


        await claimedRequest.save();


      } catch (roomError) {
        console.error(
          'Help room creation error:',
          roomError
        );


        if (
          createdRoom?._id
        ) {
          await Contribution.deleteMany({
            room:
              createdRoom._id,
          }).catch(
            () => {}
          );


          await Room.findByIdAndDelete(
            createdRoom._id
          ).catch(
            () => {}
          );
        }


        await HelpRequest.findByIdAndUpdate(
          claimedRequest._id,
          {
            $set: {
              status:
                'open',

              helper:
                null,

              room:
                null,
            },
          }
        );


        throw roomError;
      }


      // --------------------------------------------------------
      // POPULATE ROOM
      // --------------------------------------------------------

      const populatedRoom =
        await Room.findById(
          createdRoom._id
        )
          .populate(
            'problem',
            SAFE_PROBLEM_FIELDS
          )
          .populate(
            'createdBy',
            'name email avatarColor'
          )
          .populate(
            'members.user',
            'name email avatarColor'
          );


      const io =
        req.app.get(
          'io'
        );


      // --------------------------------------------------------
      // EXISTING SOCKET EVENT
      // --------------------------------------------------------

      if (io) {
        io.emit(
          'help-request-accepted',
          {
            requestId:
              claimedRequest._id,

            requesterId:
              claimedRequest.requester,

            helperId:
              req.user._id,

            roomCode:
              createdRoom.roomCode,

            room:
              populatedRoom,
          }
        );
      }


      // --------------------------------------------------------
      // NEW PRIVATE NOTIFICATION TO REQUESTER
      // --------------------------------------------------------

      await sendNotificationSafely({
        io,

        recipient:
          claimedRequest.requester,

        sender:
          req.user._id,

        type:
          'help_accepted',

        title:
          'Help Request Accepted',

        message:
          `${req.user.name} accepted your help request for ${problem.title}.`,

        link:
          `/room/${createdRoom.roomCode}`,

        metadata: {
          helpRequestId:
            claimedRequest._id,

          roomCode:
            createdRoom.roomCode,

          problemId:
            problem._id,
        },
      });


      return res.json({
        message:
          'Help request accepted successfully',

        roomCode:
          createdRoom.roomCode,

        room:
          populatedRoom,
      });


    } catch (err) {
      console.error(
        'Accept help request error:',
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
// GET HELP REQUEST ATTACHED TO ROOM
// ============================================================

exports.getHelpRequestByRoom =
  async (req, res) => {
    try {
      const room =
        await Room.findOne({
          roomCode:
            req.params.roomCode
              .toUpperCase(),
        });


      if (!room) {
        return res
          .status(404)
          .json({
            message:
              'Room not found',
          });
      }


      const helpRequest =
        await HelpRequest.findOne({
          room:
            room._id,
        })
          .populate(
            'requester',
            'name email avatarColor'
          )
          .populate(
            'helper',
            'name email avatarColor'
          )
          .populate(
            'problem',
            SAFE_PROBLEM_FIELDS
          )
          .populate(
            'resolutions.solvedBy',
            'name avatarColor'
          );


      if (!helpRequest) {
        return res.json({
          helpRequest:
            null,

          canFinish:
            false,
        });
      }


      const helperId =
        helpRequest.helper?._id ||
        helpRequest.helper;


      const canFinish =
        helperId &&
        helperId.toString() ===
          req.user._id.toString() &&
        helpRequest.status ===
          'accepted';


      return res.json({
        helpRequest,

        canFinish:
          Boolean(
            canFinish
          ),
      });


    } catch (err) {
      console.error(
        'Get room help request error:',
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
// FINISH HELP
// ============================================================

exports.finishHelp =
  async (req, res) => {
    try {
      const {
        issueType,
        problemFound,
        incorrectLocation,
        whyWrong,
        changesMade,
        solutionExplanation,
        testResult,
      } =
        req.body;


      const helpRequest =
        await HelpRequest.findById(
          req.params.id
        );


      if (!helpRequest) {
        return res
          .status(404)
          .json({
            message:
              'Help request not found',
          });
      }


      if (
        helpRequest.status !==
        'accepted'
      ) {
        return res
          .status(400)
          .json({
            message:
              'This help request cannot be finished now',
          });
      }


      if (
        !helpRequest.helper ||
        helpRequest.helper.toString() !==
          req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              'Only the assigned helper can finish this help request',
          });
      }


      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (
        !problemFound ||
        !problemFound.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain the problem you found',
          });
      }


      if (
        !whyWrong ||
        !whyWrong.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain why the code was wrong',
          });
      }


      if (
        !changesMade ||
        !changesMade.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain the changes you made',
          });
      }


      if (
        !solutionExplanation ||
        !solutionExplanation.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain how the corrected solution works',
          });
      }


      // --------------------------------------------------------
      // ROOM
      // --------------------------------------------------------

      const room =
        await Room.findById(
          helpRequest.room
        );


      if (!room) {
        return res
          .status(404)
          .json({
            message:
              'Collaboration room not found',
          });
      }


      // --------------------------------------------------------
      // RESOLUTION
      // --------------------------------------------------------

      const passed =
        Number(
          testResult?.passed
        ) || 0;


      const total =
        Number(
          testResult?.total
        ) || 0;


      const resolution = {
        oldCode:
          helpRequest.currentCode,

        newCode:
          room.currentCode,

        issueType:
          issueType ||
          'Logic Error',

        problemFound:
          problemFound.trim(),

        incorrectLocation:
          incorrectLocation?.trim() ||
          '',

        whyWrong:
          whyWrong.trim(),

        changesMade:
          changesMade.trim(),

        solutionExplanation:
          solutionExplanation.trim(),

        testResult: {
          passed,

          total,

          allPassed:
            total > 0 &&
            passed === total,
        },

        solvedBy:
          req.user._id,

        solvedAt:
          new Date(),
      };


      // --------------------------------------------------------
      // ATOMIC FINISH
      // --------------------------------------------------------

      const updatedRequest =
        await HelpRequest.findOneAndUpdate(
          {
            _id:
              helpRequest._id,

            helper:
              req.user._id,

            status:
              'accepted',
          },

          {
            $push: {
              resolutions:
                resolution,
            },

            $set: {
              status:
                'solution_sent',
            },
          },

          {
            new:
              true,
          }
        );


      if (!updatedRequest) {
        return res
          .status(409)
          .json({
            message:
              'This solution has already been sent or this help request is no longer active.',
          });
      }


      const latestResolution =
        updatedRequest.resolutions[
          updatedRequest.resolutions.length -
          1
        ];


      const io =
        req.app.get(
          'io'
        );


      // --------------------------------------------------------
      // EXISTING SOCKET EVENT
      // --------------------------------------------------------

      if (io) {
        io.emit(
          'help-request-solved',
          {
            requestId:
              updatedRequest._id,

            requesterId:
              updatedRequest.requester,

            helperId:
              req.user._id,

            helperName:
              req.user.name,

            roomCode:
              room.roomCode,

            problemId:
              updatedRequest.problem,

            message:
              'Your help request has been solved.',
          }
        );
      }


      // --------------------------------------------------------
      // PROBLEM TITLE
      // --------------------------------------------------------

      const problem =
        await Problem.findById(
          updatedRequest.problem
        ).select(
          'title'
        );


      // --------------------------------------------------------
      // PRIVATE NOTIFICATION TO REQUESTER
      // --------------------------------------------------------

      await sendNotificationSafely({
        io,

        recipient:
          updatedRequest.requester,

        sender:
          req.user._id,

        type:
          'solution_sent',

        title:
          'Solution Ready',

        message:
          `${req.user.name} solved your ${
            problem?.title ||
            'coding'
          } help request.`,

        link:
          '/my-help-requests',

        metadata: {
          helpRequestId:
            updatedRequest._id,

          roomCode:
            room.roomCode,

          problemId:
            updatedRequest.problem,
        },
      });


      return res.json({
        message:
          'Solution sent to requester successfully',

        requestId:
          updatedRequest._id,

        // IMPORTANT FIX
        status:
          updatedRequest.status,

        resolution:
          latestResolution,
      });


    } catch (err) {
      console.error(
        'Finish help error:',
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
// GET MY HELP REQUESTS
// ============================================================

exports.getMyHelpRequests =
  async (req, res) => {
    try {
      const requests =
        await HelpRequest.find({
          requester:
            req.user._id,
        })
          .populate(
            'problem',
            'title slug difficulty tags'
          )
          .populate(
            'helper',
            'name avatarColor'
          )
          .populate(
            'resolutions.solvedBy',
            'name avatarColor'
          )
          .populate(
            'room',
            'roomCode status'
          )
          .sort({
            updatedAt:
              -1,
          });


      return res.json(
        requests
      );


    } catch (err) {
      console.error(
        'Get my help requests error:',
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
// REQUESTER MARKS SOLUTION AS UNDERSTOOD
// ============================================================

exports.resolveHelpRequest =
  async (req, res) => {
    try {
      const helpRequest =
        await HelpRequest.findById(
          req.params.id
        );


      if (!helpRequest) {
        return res
          .status(404)
          .json({
            message:
              'Help request not found',
          });
      }


      if (
        helpRequest.requester.toString() !==
        req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              'Only the requester can resolve this help request',
          });
      }


      // --------------------------------------------------------
      // ALREADY RESOLVED
      // --------------------------------------------------------

      if (
        helpRequest.status ===
        'resolved'
      ) {
        if (
          helpRequest.room
        ) {
          await Room.findByIdAndUpdate(
            helpRequest.room,
            {
              $set: {
                status:
                  'completed',
              },
            }
          );
        }


        return res.json({
          message:
            '✅ Help request is already resolved',

          status:
            'resolved',

          roomStatus:
            'completed',

          alreadyResolved:
            true,
        });
      }


      // --------------------------------------------------------
      // MUST BE SOLUTION SENT
      // --------------------------------------------------------

      if (
        helpRequest.status !==
        'solution_sent'
      ) {
        return res
          .status(400)
          .json({
            message:
              `Cannot resolve this help request. Current status is "${helpRequest.status}".`,
          });
      }


      if (
        !helpRequest.resolutions ||
        helpRequest.resolutions.length ===
          0
      ) {
        return res
          .status(400)
          .json({
            message:
              'No solution has been submitted for this help request.',
          });
      }


      // --------------------------------------------------------
      // FIND ROOM BEFORE COMPLETING
      // --------------------------------------------------------

      const resolvedRoom =
        helpRequest.room
          ? await Room.findById(
              helpRequest.room
            )
          : null;


      // --------------------------------------------------------
      // RESOLVE HELP
      // --------------------------------------------------------

      helpRequest.status =
        'resolved';


      await helpRequest.save();


      // --------------------------------------------------------
      // COMPLETE ROOM
      // --------------------------------------------------------

      if (resolvedRoom) {
        resolvedRoom.status =
          'completed';

        await resolvedRoom.save();
      }


      const io =
        req.app.get(
          'io'
        );


      // --------------------------------------------------------
      // EXISTING SOCKET EVENT
      // --------------------------------------------------------

      if (io) {
        io.emit(
          'help-request-resolved',
          {
            requestId:
              helpRequest._id,

            helperId:
              helpRequest.helper,

            requesterId:
              helpRequest.requester,

            status:
              'resolved',

            roomStatus:
              'completed',

            message:
              'The requester understood and resolved the help request.',
          }
        );
      }


      // --------------------------------------------------------
      // PRIVATE NOTIFICATION TO HELPER
      // --------------------------------------------------------

      if (
        helpRequest.helper
      ) {
        await sendNotificationSafely({
          io,

          recipient:
            helpRequest.helper,

          sender:
            req.user._id,

          type:
            'help_resolved',

          title:
            'Help Successfully Resolved',

          message:
            `${req.user.name} understood your solution and resolved the help request.`,

          link:
            resolvedRoom
              ? `/room/${resolvedRoom.roomCode}`
              : '/my-rooms',

          metadata: {
            helpRequestId:
              helpRequest._id,

            roomCode:
              resolvedRoom?.roomCode ||
              '',

            problemId:
              helpRequest.problem,
          },
        });
      }


      return res.json({
        message:
          '✅ Help request resolved successfully',

        status:
          helpRequest.status,

        roomStatus:
          'completed',

        alreadyResolved:
          false,
      });


    } catch (err) {
      console.error(
        'Resolve help request error:',
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
// ASK AGAIN
// ============================================================

exports.askAgain =
  async (req, res) => {
    try {
      const {
        message,
      } =
        req.body;


      if (
        !message ||
        !message.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'Please explain what you still need help with',
          });
      }


      const helpRequest =
        await HelpRequest.findById(
          req.params.id
        );


      if (!helpRequest) {
        return res
          .status(404)
          .json({
            message:
              'Help request not found',
          });
      }


      if (
        helpRequest.requester.toString() !==
        req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              'Only the requester can ask again',
          });
      }


      if (
        helpRequest.status !==
        'solution_sent'
      ) {
        return res
          .status(400)
          .json({
            message:
              'This help request cannot be reopened now',
          });
      }


      // --------------------------------------------------------
      // SAVE OLD HELPER AND ROOM BEFORE CLEARING
      // --------------------------------------------------------

      const previousHelper =
        helpRequest.helper;


      const previousRoom =
        helpRequest.room;


      // --------------------------------------------------------
      // CONTINUE WITH LATEST CORRECTED CODE
      // --------------------------------------------------------

      const latestResolution =
        helpRequest.resolutions[
          helpRequest.resolutions.length -
          1
        ];


      if (latestResolution) {
        helpRequest.currentCode =
          latestResolution.newCode;
      }


      // --------------------------------------------------------
      // COMPLETE PREVIOUS ROOM
      // --------------------------------------------------------

      if (previousRoom) {
        await Room.findByIdAndUpdate(
          previousRoom,
          {
            $set: {
              status:
                'completed',
            },
          }
        );
      }


      // --------------------------------------------------------
      // REOPEN REQUEST
      // --------------------------------------------------------

      helpRequest.message =
        message.trim();


      helpRequest.status =
        'open';


      helpRequest.helper =
        null;


      helpRequest.room =
        null;


      await helpRequest.save();


      // --------------------------------------------------------
      // POPULATE
      // --------------------------------------------------------

      const populatedRequest =
        await HelpRequest.findById(
          helpRequest._id
        )
          .populate(
            'requester',
            'name email avatarColor'
          )
          .populate(
            'problem',
            'title slug difficulty tags'
          );


      const io =
        req.app.get(
          'io'
        );


      // --------------------------------------------------------
      // EXISTING HELP PAGE EVENT
      // --------------------------------------------------------

      if (io) {
        io.emit(
          'help-request-created',
          populatedRequest
        );
      }


      // --------------------------------------------------------
      // NOTIFY AVAILABLE USERS
      // --------------------------------------------------------

      const otherUsers =
        await User.find({
          _id: {
            $ne:
              req.user._id,
          },
        }).select(
          '_id'
        );


      await sendManyNotificationsSafely({
        io,

        recipients:
          otherUsers.map(
            (user) =>
              user._id
          ),

        sender:
          req.user._id,

        type:
          'help_reopened',

        title:
          'Help Request Reopened',

        message:
          `${req.user.name} still needs help with ${
            populatedRequest.problem?.title ||
            'a coding problem'
          }.`,

        link:
          '/help-requests',

        metadata: {
          helpRequestId:
            helpRequest._id,

          previousHelperId:
            previousHelper,

          problemId:
            helpRequest.problem,
        },
      });


      return res.json({
        message:
          'Help request reopened',

        helpRequest:
          populatedRequest,
      });


    } catch (err) {
      console.error(
        'Ask again error:',
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