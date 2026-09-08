const express = require('express');
const {
  createRoom,
  joinRoom,
  getRoom,
  saveVersion,
  restoreVersion,
  getVersions,
  postChat,
  getContributions,
  getMyRooms,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createRoom);
router.post('/join/:roomCode', joinRoom);
router.get('/my', getMyRooms);
router.get('/:roomCode', getRoom);
router.post('/:roomCode/versions', saveVersion);
router.post('/:roomCode/versions/:versionId/restore', restoreVersion);
router.get('/:roomCode/versions', getVersions);
router.post('/:roomCode/chat', postChat);
router.get('/:roomCode/contributions', getContributions);

module.exports = router;
