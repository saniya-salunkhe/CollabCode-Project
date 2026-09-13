const Room = require('../models/Room');
const Problem = require('../models/Problem');
const Contribution = require('../models/Contribution');
const {
  DEFAULT_SNIPPETS,
} = require('../config/constants');


// ============================================================
// SAFE PROBLEM FIELDS
//
// These fields can be sent to the frontend.
// Hidden test cases are intentionally NOT included.
// ============================================================

const SAFE_PROBLEM_FIELDS =
  'title slug difficulty description examples constraints tags';


// ============================================================
// CREATE A NEW COLLABORATION ROOM
// ============================================================

exports.createRoom = async (req, res) => {
  try {
    const {
      problemId,
      language,

      // NEW:
      // SoloEditor can send the code that the user
      // has already written.
      currentCode,
    } = req.body;


    // --------------------------------------------------------
    // Validate problem
    // --------------------------------------------------------

    const problem =
      await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        message: 'Problem not found',
      });
    }


    // --------------------------------------------------------
    // Select language
    // --------------------------------------------------------

    const lang =
      language || 'python';


    // --------------------------------------------------------
    // Starter code
    // --------------------------------------------------------

    const starterCode =
      problem.starterCode?.[lang] ||
      DEFAULT_SNIPPETS[lang] ||
      '';


    // --------------------------------------------------------
    // IMPORTANT:
    // If Solo Mode sends existing code, preserve it.
    //
    // Otherwise use problem starter code.
    // --------------------------------------------------------

    const initialCode =
      typeof currentCode === 'string' &&
      currentCode.trim().length > 0
        ? currentCode
        : starterCode;


    // --------------------------------------------------------
    // Generate room code
    // --------------------------------------------------------

    const roomCode =
      await generateUniqueRoomCode();


    // --------------------------------------------------------
    // Create room
    // --------------------------------------------------------

    const room =
      await Room.create({
        roomCode,

        problem:
          problem._id,

        createdBy:
          req.user._id,

        members: [
          {
            user:
              req.user._id,

            name:
              req.user.name,
          },
        ],

        currentCode:
          initialCode,

        currentLanguage:
          lang,

        status:
          'active',
      });


    // --------------------------------------------------------
    // Create contribution record for creator
    // --------------------------------------------------------

    await Contribution.create({
      room:
        room._id,

      roomCode:
        room.roomCode,

      user:
        req.user._id,

      userName:
        req.user.name,
    });


    // --------------------------------------------------------
    // Populate safe problem information
    // --------------------------------------------------------

    await room.populate(
      'problem',
      SAFE_PROBLEM_FIELDS
    );


    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(201).json({
      roomCode:
        room.roomCode,

      roomId:
        room._id,

      problem:
        room.problem,

      problemTitle:
        problem.title,

      currentCode:
        room.currentCode,

      currentLanguage:
        room.currentLanguage,

      status:
        room.status,
    });

  } catch (err) {
    console.error(
      'Create room error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// JOIN ROOM BY ROOM CODE
// ============================================================

exports.joinRoom = async (req, res) => {
  try {
    const {
      roomCode,
    } = req.params;


    // --------------------------------------------------------
    // Find room
    // --------------------------------------------------------

    const room =
      await Room.findOne({
        roomCode:
          roomCode.toUpperCase(),
      })
        .populate(
          'problem',
          SAFE_PROBLEM_FIELDS
        );


    if (!room) {
      return res.status(404).json({
        message: 'Room not found',
      });
    }


    if (
      room.status !== 'active'
    ) {
      return res.status(400).json({
        message:
          'Room is no longer active',
      });
    }


    // --------------------------------------------------------
    // Add member if not already present
    // --------------------------------------------------------

    const alreadyMember =
      room.members.some(
        (member) =>
          member.user &&
          member.user.toString() ===
            req.user._id.toString()
      );


    if (!alreadyMember) {
      room.members.push({
        user:
          req.user._id,

        name:
          req.user.name,
      });
    }


    // --------------------------------------------------------
    // Ensure contribution record exists
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
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );


    // --------------------------------------------------------
    // Save room
    // --------------------------------------------------------

    await room.save();


    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.json({
      roomCode:
        room.roomCode,

      roomId:
        room._id,

      problem:
        room.problem,

      problemId:
        room.problem?._id,

      problemTitle:
        room.problem?.title,

      difficulty:
        room.problem?.difficulty,

      currentCode:
        room.currentCode,

      currentLanguage:
        room.currentLanguage,

      status:
        room.status,

      members:
        room.members.map(
          (member) => ({
            name:
              member.name,

            joinedAt:
              member.joinedAt,
          })
        ),
    });

  } catch (err) {
    console.error(
      'Join room error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// GET ROOM INFO
// ============================================================

exports.getRoom = async (req, res) => {
  try {
    const room =
      await Room.findOne({
        roomCode:
          req.params.roomCode.toUpperCase(),
      })

        // IMPORTANT:
        // Return complete safe problem details for
        // the Problem tab in Room.jsx.
        .populate(
          'problem',
          SAFE_PROBLEM_FIELDS
        )

        .populate(
          'members.user',
          'name avatarColor'
        );


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    return res.json({
      roomCode:
        room.roomCode,

      roomId:
        room._id,

      // Full safe problem information
      problem:
        room.problem,

      currentCode:
        room.currentCode,

      currentLanguage:
        room.currentLanguage,

      members:
        room.members.map(
          (member) => ({
            userId:
              member.user?._id,

            name:
              member.name ||
              member.user?.name,

            avatarColor:
              member.user
                ?.avatarColor ||
              '#6366f1',

            joinedAt:
              member.joinedAt,
          })
        ),

      versions:
        room.versions
          .slice(-20)
          .reverse(),

      chat:
        room.chat
          .slice(-100),

      status:
        room.status,

      createdAt:
        room.createdAt,

      updatedAt:
        room.updatedAt,
    });

  } catch (err) {
    console.error(
      'Get room error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// SAVE A CODE VERSION / SNAPSHOT
// ============================================================

exports.saveVersion = async (req, res) => {
  try {
    const {
      roomCode,
    } = req.params;

    const {
      code,
      language,
      label,
    } = req.body;


    // --------------------------------------------------------
    // Find room
    // --------------------------------------------------------

    const room =
      await Room.findOne({
        roomCode:
          roomCode.toUpperCase(),
      });


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    // --------------------------------------------------------
    // Save version
    // --------------------------------------------------------

    room.versions.push({
      code,

      language,

      label:
        label || '',

      savedBy:
        req.user._id,

      savedByName:
        req.user.name,
    });


    // --------------------------------------------------------
    // Update contribution statistics
    // --------------------------------------------------------

    await Contribution.updateOne(
      {
        room:
          room._id,

        user:
          req.user._id,
      },

      {
        $inc: {
          codeSaves: 1,
        },
      }
    );


    await room.save();


    return res.status(201).json({
      message:
        'Version saved',

      version:
        room.versions[
          room.versions.length - 1
        ],
    });

  } catch (err) {
    console.error(
      'Save version error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// RESTORE A PREVIOUS VERSION
// ============================================================

exports.restoreVersion = async (
  req,
  res
) => {
  try {
    const {
      roomCode,
      versionId,
    } = req.params;


    // --------------------------------------------------------
    // Find room
    // --------------------------------------------------------

    const room =
      await Room.findOne({
        roomCode:
          roomCode.toUpperCase(),
      });


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    // --------------------------------------------------------
    // Find version
    // --------------------------------------------------------

    const version =
      room.versions.id(
        versionId
      );


    if (!version) {
      return res.status(404).json({
        message:
          'Version not found',
      });
    }


    // --------------------------------------------------------
    // Save current code before restoring
    // --------------------------------------------------------

    room.versions.push({
      code:
        room.currentCode,

      language:
        room.currentLanguage,

      label:
        'Auto-save before restore',

      savedBy:
        req.user._id,

      savedByName:
        req.user.name,
    });


    // --------------------------------------------------------
    // Restore version
    // --------------------------------------------------------

    room.currentCode =
      version.code;

    room.currentLanguage =
      version.language;


    await room.save();


    return res.json({
      message:
        'Version restored',

      code:
        version.code,

      language:
        version.language,
    });

  } catch (err) {
    console.error(
      'Restore version error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// GET ROOM VERSIONS
// ============================================================

exports.getVersions = async (
  req,
  res
) => {
  try {
    const room =
      await Room.findOne({
        roomCode:
          req.params.roomCode.toUpperCase(),
      })
        .select(
          'versions'
        );


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    const versions =
      [...room.versions]
        .reverse()
        .slice(0, 50);


    return res.json(
      versions
    );

  } catch (err) {
    console.error(
      'Get versions error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// POST CHAT MESSAGE
// ============================================================

exports.postChat = async (
  req,
  res
) => {
  try {
    const {
      roomCode,
    } = req.params;

    const {
      text,
    } = req.body;


    // --------------------------------------------------------
    // Validate
    // --------------------------------------------------------

    if (
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        message:
          'Message cannot be empty',
      });
    }


    // --------------------------------------------------------
    // Find room
    // --------------------------------------------------------

    const room =
      await Room.findOne({
        roomCode:
          roomCode.toUpperCase(),
      });


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    // --------------------------------------------------------
    // Create message
    // --------------------------------------------------------

    const msg = {
      sender:
        req.user._id,

      senderName:
        req.user.name,

      text:
        text.trim(),
    };


    room.chat.push(
      msg
    );


    await room.save();


    // --------------------------------------------------------
    // Update contributions
    // --------------------------------------------------------

    await Contribution.updateOne(
      {
        room:
          room._id,

        user:
          req.user._id,
      },

      {
        $inc: {
          chatMessages: 1,
        },
      }
    );


    return res
      .status(201)
      .json(msg);

  } catch (err) {
    console.error(
      'Post chat error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// GET CONTRIBUTION ANALYTICS
// ============================================================

exports.getContributions = async (
  req,
  res
) => {
  try {
    const room =
      await Room.findOne({
        roomCode:
          req.params.roomCode.toUpperCase(),
      })
        .select(
          '_id roomCode'
        );


    if (!room) {
      return res.status(404).json({
        message:
          'Room not found',
      });
    }


    const contributions =
      await Contribution.find({
        room:
          room._id,
      })
        .sort({
          charactersAdded: -1,
        });


    return res.json(
      contributions
    );

  } catch (err) {
    console.error(
      'Get contributions error:',
      err
    );

    return res.status(500).json({
      message: err.message,
    });
  }
};


// ============================================================
// LIST ROOMS CREATED BY / JOINED BY USER
// ============================================================

// ============================================================
// LIST ACTIVE ROOMS FOR USER
// ============================================================

exports.getMyRooms = async (
  req,
  res
) => {
  try {
    const rooms =
      await Room.find({
        'members.user':
          req.user._id,

        // IMPORTANT:
        // My Rooms currently displays ACTIVE rooms only.
        status:
          'active',
      })

        .populate(
          'problem',
          'title slug difficulty'
        )

        .select(
          'roomCode problem currentLanguage status createdAt updatedAt'
        )

        .sort({
          updatedAt:
            -1,
        })

        .limit(50);

    return res.json(
      rooms
    );

  } catch (err) {
    console.error(
      'Get my rooms error:',
      err
    );

    return res.status(500).json({
      message:
        err.message,
    });
  }
};


// ============================================================
// HELPER: GENERATE UNIQUE ROOM CODE
// ============================================================

async function generateUniqueRoomCode() {
  let code;

  let attempts = 0;


  do {
    code =
      Room.generateRoomCode();

    const existing =
      await Room.findOne({
        roomCode: code,
      });


    if (!existing) {
      return code;
    }


    attempts++;

  } while (
    attempts < 10
  );


  // Extremely unlikely fallback
  return (
    Room.generateRoomCode() +
    Date.now()
      .toString()
      .slice(-2)
  );
}