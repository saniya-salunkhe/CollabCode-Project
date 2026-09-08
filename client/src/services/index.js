import API from './api';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  getLeaderboard: () => API.get('/auth/leaderboard'),
};

export const problemService = {
  getAll: (params) => API.get('/problems', { params }),
  getBySlug: (slug) => API.get(`/problems/slug/${slug}`),
  getById: (id) => API.get(`/problems/${id}`),
};

export const roomService = {
  create: (data) => API.post('/rooms', data),
  join: (roomCode) => API.post(`/rooms/join/${roomCode}`),
  get: (roomCode) => API.get(`/rooms/${roomCode}`),
  saveVersion: (roomCode, data) => API.post(`/rooms/${roomCode}/versions`, data),
  restoreVersion: (roomCode, versionId) => API.post(`/rooms/${roomCode}/versions/${versionId}/restore`),
  getVersions: (roomCode) => API.get(`/rooms/${roomCode}/versions`),
  postChat: (roomCode, text) => API.post(`/rooms/${roomCode}/chat`, { text }),
  getContributions: (roomCode) => API.get(`/rooms/${roomCode}/contributions`),
  getMyRooms: () => API.get('/rooms/my'),
};

export const submissionService = {
  run: (data) => API.post('/submissions/run', data),
  test: (data) => API.post('/submissions/test', data),
  submit: (data) => API.post('/submissions/submit', data),
  getMy: (params) => API.get('/submissions', { params }),
  getById: (id) => API.get(`/submissions/${id}`),
};

export const reviewService = {
  create: (roomCode, data) => API.post(`/reviews/${roomCode}`, data),
  getRoomReviews: (roomCode) => API.get(`/reviews/${roomCode}`),
  toggleComment: (reviewId, commentId) => API.patch(`/reviews/${reviewId}/comments/${commentId}`),
  addComment: (reviewId, data) => API.post(`/reviews/${reviewId}/comments`, data),
};
