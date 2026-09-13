const express =
  require('express');

const router =
  express.Router();

const {
  createHelpRequest,
  getOpenHelpRequests,
  acceptHelpRequest,

  getHelpRequestByRoom,
  finishHelp,
  getMyHelpRequests,
  resolveHelpRequest,
  askAgain,
} =
  require(
    '../controllers/helpRequestController'
  );

const {
  protect,
} =
  require('../middleware/auth');


router.use(protect);


// ============================================================
// CREATE REQUEST
// ============================================================

router.post(
  '/',
  createHelpRequest
);


// ============================================================
// GET OPEN REQUESTS FOR HELPERS
// ============================================================

router.get(
  '/open',
  getOpenHelpRequests
);


// ============================================================
// REQUESTER'S OWN REQUESTS
// ============================================================

router.get(
  '/mine',
  getMyHelpRequests
);


// ============================================================
// GET REQUEST ASSOCIATED WITH ROOM
// ============================================================

router.get(
  '/room/:roomCode',
  getHelpRequestByRoom
);


// ============================================================
// ACCEPT REQUEST
// ============================================================

router.post(
  '/:id/accept',
  acceptHelpRequest
);


// ============================================================
// HELPER FINISHES HELP
// ============================================================

router.post(
  '/:id/finish',
  finishHelp
);


// ============================================================
// REQUESTER ACCEPTS SOLUTION
// ============================================================

router.patch(
  '/:id/resolve',
  resolveHelpRequest
);


// ============================================================
// REQUESTER ASKS AGAIN
// ============================================================

router.patch(
  '/:id/ask-again',
  askAgain
);


module.exports =
  router;