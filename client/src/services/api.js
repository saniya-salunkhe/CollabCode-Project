import axios from 'axios';


// ============================================================
// API BASE URL
// ============================================================
//
// Local development:
// http://localhost:5000/api
//
// Production:
// VITE_API_URL from Render environment variables
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';


// ============================================================
// AXIOS INSTANCE
// ============================================================

const API = axios.create({
  baseURL:
    API_BASE_URL,

  headers: {
    'Content-Type':
      'application/json',
  },
});


// ============================================================
// ATTACH JWT TOKEN TO EVERY REQUEST
// ============================================================

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        'collabcode_token'
      );


    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }


    return config;
  },

  (error) => {
    return Promise.reject(
      error
    );
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
//
// Automatically logout user if JWT is invalid / expired.
// ============================================================

API.interceptors.response.use(
  (response) =>
    response,


  (error) => {

    if (
      error.response?.status ===
      401
    ) {

      localStorage.removeItem(
        'collabcode_token'
      );


      localStorage.removeItem(
        'collabcode_user'
      );


      if (
        window.location.pathname !==
          '/login' &&
        window.location.pathname !==
          '/register'
      ) {

        window.location.href =
          '/login';
      }
    }


    return Promise.reject(
      error
    );
  }
);


export default API;