const express =
  require('express');


const {
  searchUsers,
  inviteUser,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} =
  require(
    '../controllers/roomInvitationController'
  );


const {
  protect,
} =
  require('../middleware/auth');


const router =
  express.Router();


router.use(
  protect
);


// Search friend
router.get(
  '/search-users',
  searchUsers
);


// My invitations
router.get(
  '/mine',
  getMyInvitations
);


// Send invitation
router.post(
  '/rooms/:roomCode',
  inviteUser
);


// Accept
router.patch(
  '/:id/accept',
  acceptInvitation
);


// Decline
router.patch(
  '/:id/decline',
  declineInvitation
);


module.exports =
  router;