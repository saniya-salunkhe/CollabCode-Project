const Room = require('../models/Room');
const Problem = require('../models/Problem');
const Contribution = require('../models/Contribution');
const { DEFAULT_SNIPPETS } = require('../config/constants');

// ── Create a new collaboration room ───────────────────────
exports.createRoom = async (req, res) => {
  try {
    const { problemId, language } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const lang = language || 'python';
    const starterCode =
      problem.starterCode?.[lang] || DEFAULT_SNIPPETS[lang] || '';

    const roomCode = await generateUniqueRoomCode();

    const room = await Room.create({
      roomCode,
      problem: problem._id,
      createdBy: req.user._id,
      members: [{ user: req.user._id, name: req.user.name }],
      currentCode: starterCode,
      currentLanguage: lang,
    });

    // initialise contribution record for the creator
    await Contribution.create({
      room: room._id,
      roomCode: room.roomCode,
      user: req.user._id,
      userName: req.user.name,
    });

    const populated = await room.populate('problem', 'title slug difficulty');
    res.status(201).json({
      roomCode: room.roomCode,
      roomId: room._id,
      problemTitle: problem.title,
      currentCode: room.currentCode,
      currentLanguage: room.currentLanguage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Join room by room code ────────────────────────────────
exports.joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() }).populate('problem', 'title slug difficulty');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.status !== 'active') {
      return res.status(400).json({ message: 'Room is no longer active' });
    }

    // Add member if not already present
    const alreadyMember = room.members.some(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (!alreadyMember) {
      room.members.push({ user: req.user._id, name: req.user.name });
    }

    // ensure contribution record exists
    await Contribution.findOneAndUpdate(
      { room: room._id, user: req.user._id },
      {},
      { upsert: true, setDefaultsOnInsert: true }
    );

    await room.save();

    res.json({
      roomCode: room.roomCode,
      roomId: room._id,
      problemId: room.problem._id,
      problemTitle: room.problem.title,
      difficulty: room.problem.difficulty,
      currentCode: room.currentCode,
      currentLanguage: room.currentLanguage,
      members: room.members.map((m) => ({ name: m.name, joinedAt: m.joinedAt })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get room info ─────────────────────────────────────────
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .populate('problem', 'title slug difficulty description examples constraints timeLimit memoryLimit')
      .populate('members.user', 'name avatarColor');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      roomCode: room.roomCode,
      roomId: room._id,
      problem: room.problem,
      currentCode: room.currentCode,
      currentLanguage: room.currentLanguage,
      members: room.members.map((m) => ({
        name: m.name,
        avatarColor: m.user?.avatarColor || '#6366f1',
        joinedAt: m.joinedAt,
      })),
      versions: room.versions.slice(-20).reverse(),
      chat: room.chat.slice(-100),
      status: room.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Save a code version / snapshot ─────────────────────────
exports.saveVersion = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { code, language, label } = req.body;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.versions.push({
      code,
      language,
      label: label || '',
      savedBy: req.user._id,
      savedByName: req.user.name,
    });

    // update contribution count
    await Contribution.updateOne(
      { room: room._id, user: req.user._id },
      { $inc: { codeSaves: 1 } }
    );

    await room.save();
    res.status(201).json({
      message: 'Version saved',
      version: room.versions[room.versions.length - 1],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Restore a previous version ────────────────────────────
exports.restoreVersion = async (req, res) => {
  try {
    const { roomCode, versionId } = req.params;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const version = room.versions.id(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Save the current code as a new version before restoring
    room.versions.push({
      code: room.currentCode,
      language: room.currentLanguage,
      label: 'Auto-save before restore',
      savedBy: req.user._id,
      savedByName: req.user.name,
    });

    room.currentCode = version.code;
    room.currentLanguage = version.language;

    await room.save();
    res.json({
      message: 'Version restored',
      code: version.code,
      language: version.language,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get room versions (history) ────────────────────────────
exports.getVersions = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
      .select('versions');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room.versions.reverse().slice(0, 50));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Post a chat message ───────────────────────────────────
exports.postChat = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const msg = {
      sender: req.user._id,
      senderName: req.user.name,
      text: text.trim(),
    };
    room.chat.push(msg);
    await room.save();

    await Contribution.updateOne(
      { room: room._id, user: req.user._id },
      { $inc: { chatMessages: 1 } }
    );

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get contribution analytics for a room ────────────────
exports.getContributions = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() }).select('_id roomCode');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const contributions = await Contribution.find({ room: room._id }).sort({ charactersAdded: -1 });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── List rooms created by / joined by the user ────────────
exports.getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 'members.user': req.user._id })
      .populate('problem', 'title slug difficulty')
      .select('roomCode problem currentLanguage status createdAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Helper: generate a unique room code ───────────────────
async function generateUniqueRoomCode() {
  const Room = require('../models/Room');
  let code;
  let attempts = 0;
  do {
    code = Room.generateRoomCode();
    const existing = await Room.findOne({ roomCode: code });
    if (!existing) return code;
    attempts++;
  } while (attempts < 10);
  return Room.generateRoomCode() + Date.now().toString().slice(-2);
}
