import API from './api';


// ============================================================
// AUTH SERVICE
// ============================================================

export const authService = {

  register: (data) =>
    API.post(
      '/auth/register',
      data
    ),

  login: (data) =>
    API.post(
      '/auth/login',
      data
    ),

  getMe: () =>
    API.get(
      '/auth/me'
    ),

  getLeaderboard: () =>
    API.get(
      '/auth/leaderboard'
    ),
};


// ============================================================
// PROBLEM SERVICE
// ============================================================

export const problemService = {

  getAll: (params) =>
    API.get(
      '/problems',
      {
        params,
      }
    ),

  getBySlug: (slug) =>
    API.get(
      `/problems/slug/${slug}`
    ),

  getById: (id) =>
    API.get(
      `/problems/${id}`
    ),
};


// ============================================================
// ROOM SERVICE
// ============================================================

export const roomService = {

  create: (data) =>
    API.post(
      '/rooms',
      data
    ),

  join: (roomCode) =>
    API.post(
      `/rooms/join/${roomCode}`
    ),

  get: (roomCode) =>
    API.get(
      `/rooms/${roomCode}`
    ),

  saveVersion: (
    roomCode,
    data
  ) =>
    API.post(
      `/rooms/${roomCode}/versions`,
      data
    ),

  restoreVersion: (
    roomCode,
    versionId
  ) =>
    API.post(
      `/rooms/${roomCode}/versions/${versionId}/restore`
    ),

  getVersions: (
    roomCode
  ) =>
    API.get(
      `/rooms/${roomCode}/versions`
    ),

  postChat: (
    roomCode,
    text
  ) =>
    API.post(
      `/rooms/${roomCode}/chat`,
      {
        text,
      }
    ),

  getContributions: (
    roomCode
  ) =>
    API.get(
      `/rooms/${roomCode}/contributions`
    ),

  getMyRooms: () =>
    API.get(
      '/rooms/my'
    ),
};


// ============================================================
// SUBMISSION SERVICE
// ============================================================

export const submissionService = {

  run: (data) =>
    API.post(
      '/submissions/run',
      data
    ),

  test: (data) =>
    API.post(
      '/submissions/test',
      data
    ),

  submit: (data) =>
    API.post(
      '/submissions/submit',
      data
    ),

  getMy: (params) =>
    API.get(
      '/submissions',
      {
        params,
      }
    ),

  getById: (id) =>
    API.get(
      `/submissions/${id}`
    ),
};


// ============================================================
// REVIEW SERVICE
// ============================================================

export const reviewService = {

  create: (
    roomCode,
    data
  ) =>
    API.post(
      `/reviews/${roomCode}`,
      data
    ),

  getRoomReviews: (
    roomCode
  ) =>
    API.get(
      `/reviews/${roomCode}`
    ),

  toggleComment: (
    reviewId,
    commentId
  ) =>
    API.patch(
      `/reviews/${reviewId}/comments/${commentId}`
    ),

  addComment: (
    reviewId,
    data
  ) =>
    API.post(
      `/reviews/${reviewId}/comments`,
      data
    ),
};


// ============================================================
// HELP REQUEST SERVICE
// ============================================================

export const helpRequestService = {

  // Create help request
  create: (data) =>
    API.post(
      '/help-requests',
      data
    ),

  // Get open help requests
  getOpen: () =>
    API.get(
      '/help-requests/open'
    ),

  // Accept help request
  accept: (id) =>
    API.post(
      `/help-requests/${id}/accept`
    ),

  // Get help request attached to room
  getByRoom: (
    roomCode
  ) =>
    API.get(
      `/help-requests/room/${roomCode}`
    ),

  // Helper sends solution
  finish: (
    id,
    data
  ) =>
    API.post(
      `/help-requests/${id}/finish`,
      data
    ),

  // Requester's requests
  getMine: () =>
    API.get(
      '/help-requests/mine'
    ),

  // Understood & Resolve
  resolve: (id) =>
    API.patch(
      `/help-requests/${id}/resolve`
    ),

  // Ask Again
  askAgain: (
    id,
    message
  ) =>
    API.patch(
      `/help-requests/${id}/ask-again`,
      {
        message,
      }
    ),
};


// ============================================================
// NOTIFICATION SERVICE
// ============================================================

export const notificationService = {

  // Get current user's notifications
  getMine: () =>
    API.get(
      '/notifications'
    ),

  // Get unread count
  getUnreadCount: () =>
    API.get(
      '/notifications/unread-count'
    ),

  // Mark one notification as read
  markAsRead: (id) =>
    API.patch(
      `/notifications/${id}/read`
    ),

  // Mark all notifications as read
  markAllAsRead: () =>
    API.patch(
      '/notifications/read-all'
    ),
};


// ============================================================
// ROOM INVITATION SERVICE
// ============================================================

export const roomInvitationService = {

  // ----------------------------------------------------------
  // SEARCH COLLABCODE USERS
  // Search by name or email
  // ----------------------------------------------------------

  searchUsers: (query) =>
    API.get(
      '/room-invitations/search-users',
      {
        params: {
          q: query,
        },
      }
    ),


  // ----------------------------------------------------------
  // SEND INVITATION
  // ----------------------------------------------------------

  invite: (
    roomCode,
    userId
  ) =>
    API.post(
      `/room-invitations/rooms/${roomCode}`,
      {
        userId,
      }
    ),


  // ----------------------------------------------------------
  // GET CURRENT USER'S INVITATIONS
  // ----------------------------------------------------------

  getMine: () =>
    API.get(
      '/room-invitations/mine'
    ),


  // ----------------------------------------------------------
  // ACCEPT INVITATION
  // ----------------------------------------------------------

  accept: (id) =>
    API.patch(
      `/room-invitations/${id}/accept`
    ),


  // ----------------------------------------------------------
  // DECLINE INVITATION
  // ----------------------------------------------------------

  decline: (id) =>
    API.patch(
      `/room-invitations/${id}/decline`
    ),
};