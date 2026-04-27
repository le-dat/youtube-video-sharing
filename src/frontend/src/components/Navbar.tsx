import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants/routes';
import { NotificationBell } from './NotificationBell';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="bg-surface border-b-3 border-text-primary px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link to={ROUTES.HOME} className="text-2xl font-bold text-secondary">
          YouTube Share
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to={ROUTES.SHARE}
                className="bg-primary text-text-primary font-bold px-4 py-2 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Share Video
              </Link>

              <NotificationBell />

              <span className="text-text-secondary">Hello, {user?.username}</span>

              <button
                onClick={handleLogout}
                className="text-text-secondary hover:text-text-primary"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="text-text-secondary hover:text-text-primary">
                Login
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="bg-secondary text-surface font-bold px-4 py-2 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
