const Room = require('../models/Room');
const Contribution = require('../models/Contribution');
const { socketAuth } = require('../middleware/auth');

// Track active rooms and their connected users
// Map<roomCode, Map<socketId, {user, cursor, selection, color>>>
const activeRooms = new Map();

// Assign a stable colour per user per room for cursor highlighting
const CURSOR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function pickColor(index) {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

function initSockets(io) {
  // Auth middleware for all socket connections
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // ── JOIN ROOM ──────────────────────────────────────
    socket.on('room:join', async ({ roomCode }) => {
      try {
        const code = roomCode.toUpperCase();
        socket.join(code);

        // Track user in activeRooms
        if (!activeRooms.has(code)) {
          activeRooms.set(code, new Map());
        }
        const room = activeRooms.get(code);
        const color = pickColor(room.size);
        room.set(socket.id, {
          user: socket.user,
          color,
          cursor: null,
        });

        // Notify others
        socket.to(code).emit('user:joined', {
          name: socket.user.name,
          userId: socket.user._id,
        });

        // Send current online list to the newcomer
        const onlineUsers = Array.from(room.values()).map((entry) => ({
          name: entry.user.name,
          userId: entry.user._id,
          color: entry.color,
        }));
        io.to(code).emit('room:users', onlineUsers);

        // Send current code state
        const dbRoom = await Room.findOne({ roomCode: code });
        if (dbRoom) {
          socket.emit('code:sync', {
            code: dbRoom.currentCode,
            language: dbRoom.currentLanguage,
          });
        }

        console.log(`✅ ${socket.user.name} joined room ${code}`);
      } catch (err) {
        console.error('Join room error:', err.message);
      }
    });

    // ── CODE EDIT (operational transform-style delta) ──
    // Client sends the full new code on each change for simplicity.
    // For a production app you would switch to OT or CRDT deltas,
    // but full-state sync is fine for a learning platform with small rooms.
    socket.on('code:edit', async ({ roomCode, code, language }) => {
      const codeKey = roomCode.toUpperCase();
      socket.to(codeKey).emit('code:update', { code, language });

      // Persist to DB (debounced on client, so this is okay)
      try {
        await Room.updateOne(
          { roomCode: codeKey },
          { $set: { currentCode: code, currentLanguage: language || undefined } }
        );
      } catch (err) {
        // Non-fatal — socket broadcast already went out
      }
    });

    // ── LANGUAGE CHANGE ────────────────────────────────
    socket.on('code:language', async ({ roomCode, language }) => {
      const codeKey = roomCode.toUpperCase();
      socket.to(codeKey).emit('code:language', { language });
      try {
        await Room.updateOne({ roomCode: codeKey }, { $set: { currentLanguage: language } });
      } catch (err) {
        // ignore
      }
    });

    // ── CURSOR MOVEMENT ────────────────────────────────
    socket.on('cursor:move', ({ roomCode, position, selection }) => {
      const codeKey = roomCode.toUpperCase();
      const room = activeRooms.get(codeKey);
      if (!room) return;
      const entry = room.get(socket.id);
      if (!entry) return;
      entry.cursor = { position, selection };
      socket.to(codeKey).emit('cursor:update', {
        userId: socket.user._id,
        name: socket.user.name,
        color: entry.color,
        position,
        selection,
      });
    });

    // ── CHAT MESSAGE (real-time) ───────────────────────
    socket.on('chat:message', async ({ roomCode, text }) => {
      const codeKey = roomCode.toUpperCase();
      const msg = {
        sender: socket.user._id,
        senderName: socket.user.name,
        text,
        createdAt: new Date(),
      };
      socket.to(codeKey).emit('chat:message', msg);
      // also echo back to sender so the UI confirms
      socket.emit('chat:message', msg);

      // Persist to room + contribution tracking
      try {
        await Room.updateOne(
          { roomCode: codeKey },
          { $push: { chat: msg } }
        );
        await Contribution.updateOne(
          { room: (await Room.findOne({ roomCode: codeKey }).select('_id'))._id,
            user: socket.user._id },
          { $inc: { chatMessages: 1 } }
        );
      } catch (err) {
        // non-fatal
      }
    });

    // ── CODE VERSION SAVED ─────────────────────────────
    socket.on('code:saveVersion', async ({ roomCode, code, language, label }) => {
      const codeKey = roomCode.toUpperCase();
      try {
        const room = await Room.findOne({ roomCode: codeKey });
        if (!room) return;
        room.versions.push({
          code,
          language,
          label: label || '',
          savedBy: socket.user._id,
          savedByName: socket.user.name,
        });
        await room.save();

        await Contribution.updateOne(
          { room: room._id, user: socket.user._id },
          { $inc: { codeSaves: 1 } }
        );

        const version = room.versions[room.versions.length - 1];
        io.to(codeKey).emit('version:saved', version);
      } catch (err) {
        console.error('Save version error:', err.message);
      }
    });

    // ── CONTRIBUTION TRACK (characters added / deleted) ─
    // Client sends periodic diffs: {added, deleted, linesEdited}
    socket.on('contribution:update', async ({ roomCode, added = 0, deleted = 0, linesEdited = 0 }) => {
      const codeKey = roomCode.toUpperCase();
      try {
        const room = await Room.findOne({ roomCode: codeKey }).select('_id');
        if (!room) return;
        await Contribution.updateOne(
          { room: room._id, user: socket.user._id },
          {
            $inc: {
              charactersAdded: added,
              charactersDeleted: deleted,
              linesEdited,
            },
          }
        );
      } catch (err) {
        // non-fatal
      }
    });

    // ── TYPING INDICATOR ───────────────────────────────
    socket.on('typing:start', ({ roomCode }) => {
      socket.to(roomCode.toUpperCase()).emit('typing:start', { name: socket.user.name });
    });
    socket.on('typing:stop', ({ roomCode }) => {
      socket.to(roomCode.toUpperCase()).emit('typing:stop', { name: socket.user.name });
    });

    // ── DISCONNECT ─────────────────────────────────────
    socket.on('disconnect', () => {
      for (const [code, room] of activeRooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(code).emit('user:left', {
            name: socket.user.name,
            userId: socket.user._id,
          });
          // Update online users list
          const onlineUsers = Array.from(room.values()).map((entry) => ({
            name: entry.user.name,
            userId: entry.user._id,
            color: entry.color,
          }));
          io.to(code).emit('room:users', onlineUsers);
          if (room.size === 0) activeRooms.delete(code);
          break;
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
}

module.exports = { initSockets, activeRooms };
