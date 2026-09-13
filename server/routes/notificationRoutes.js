const express =
  require('express');

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} =
  require(
    '../controllers/notificationController'
  );

const {
  protect,
} =
  require('../middleware/auth');


const router =
  express.Router();


// All notification routes require login
router.use(
  protect
);


// ============================================================
// GET NOTIFICATIONS
// ============================================================

router.get(
  '/',
  getMyNotifications
);


// ============================================================
// GET UNREAD COUNT
// ============================================================

router.get(
  '/unread-count',
  getUnreadCount
);


// ============================================================
// MARK ALL READ
//
// Keep this BEFORE /:id/read
// ============================================================

router.patch(
  '/read-all',
  markAllAsRead
);


// ============================================================
// MARK ONE READ
// ============================================================

router.patch(
  '/:id/read',
  markAsRead
);


module.exports =
  router;