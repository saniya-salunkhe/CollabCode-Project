import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Problems' },
    { path: '/my-rooms', label: 'My Rooms' },
    { path: '/submissions', label: 'Submissions' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <img src="/favicon.svg" alt="CollabCode" />
        CollabCode
      </Link>

      <div className="navbar-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="navbar-user">
        {user && (
          <>
            <div className="avatar" style={{ background: user.avatarColor }}>
              {getInitials(user.name)}
            </div>
            <span className="text-sm text-secondary">{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
