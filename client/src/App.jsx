import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProblemDetail from './pages/ProblemDetail';
import SoloEditor from './pages/SoloEditor';
import Room from './pages/Room';
import Submissions from './pages/Submissions';
import Leaderboard from './pages/Leaderboard';
import MyRooms from './pages/MyRooms';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/problem/:slug" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
        <Route path="/solo/:problemId" element={<ProtectedRoute><SoloEditor /></ProtectedRoute>} />
        <Route path="/room/:roomCode" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/my-rooms" element={<ProtectedRoute><MyRooms /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}
