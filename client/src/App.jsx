import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  useAuth,
} from './contexts/AuthContext';

import Navbar
  from './components/Navbar';

import ToastContainer
  from './components/ToastContainer';


// ============================================================
// PAGES
// ============================================================

import Login
  from './pages/Login';

import Register
  from './pages/Register';

import Dashboard
  from './pages/Dashboard';

import ProblemDetail
  from './pages/ProblemDetail';

import SoloEditor
  from './pages/SoloEditor';

import Room
  from './pages/Room';

import Submissions
  from './pages/Submissions';

import Leaderboard
  from './pages/Leaderboard';

import MyRooms
  from './pages/MyRooms';

import HelpRequests
  from './pages/HelpRequests';

import MyHelpRequests
  from './pages/MyHelpRequests';

import Invitations
  from './pages/Invitations';


// ============================================================
// PROTECTED ROUTE
// ============================================================

const ProtectedRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading,
  } =
    useAuth();


  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return children;
};


// ============================================================
// PUBLIC ROUTE
// ============================================================

const PublicRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading,
  } =
    useAuth();


  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }


  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  return children;
};


// ============================================================
// APP
// ============================================================

export default function App() {
  const {
    isAuthenticated,
  } =
    useAuth();


  return (
    <>

      {/* ===================================================== */}
      {/* NAVBAR */}
      {/* Show only when user is logged in */}
      {/* ===================================================== */}

      {isAuthenticated && (
        <Navbar />
      )}


      {/* ===================================================== */}
      {/* TOAST NOTIFICATIONS */}
      {/* ===================================================== */}

      <ToastContainer />


      {/* ===================================================== */}
      {/* ROUTES */}
      {/* ===================================================== */}

      <Routes>

        {/* =================================================== */}
        {/* PUBLIC ROUTES */}
        {/* =================================================== */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />


        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />


        {/* =================================================== */}
        {/* DASHBOARD */}
        {/* =================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* PROBLEM DETAILS */}
        {/* =================================================== */}

        <Route
          path="/problem/:slug"
          element={
            <ProtectedRoute>
              <ProblemDetail />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* SOLO CODING EDITOR */}
        {/* =================================================== */}

        <Route
          path="/solo/:problemId"
          element={
            <ProtectedRoute>
              <SoloEditor />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* COLLABORATION ROOM */}
        {/* =================================================== */}

        <Route
          path="/room/:roomCode"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* MY ROOMS */}
        {/* =================================================== */}

        <Route
          path="/my-rooms"
          element={
            <ProtectedRoute>
              <MyRooms />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* NEW: COLLABORATION INVITATIONS */}
        {/* =================================================== */}

        <Route
          path="/invitations"
          element={
            <ProtectedRoute>
              <Invitations />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* HELP REQUESTS */}
        {/* Helpers see requests from other users */}
        {/* =================================================== */}

        <Route
          path="/help-requests"
          element={
            <ProtectedRoute>
              <HelpRequests />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* MY HELP REQUESTS */}
        {/* Requester sees their own requests + solutions */}
        {/* =================================================== */}

        <Route
          path="/my-help-requests"
          element={
            <ProtectedRoute>
              <MyHelpRequests />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* SUBMISSION HISTORY */}
        {/* =================================================== */}

        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <Submissions />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* LEADERBOARD */}
        {/* =================================================== */}

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================== */}
        {/* DEFAULT ROUTE */}
        {/* =================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =================================================== */}
        {/* UNKNOWN ROUTE */}
        {/* =================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </>
  );
}