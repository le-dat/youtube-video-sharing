import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-9xl font-black text-primary shadow-neo-sm mb-8">404</h1>
      <h2 className="text-3xl font-bold text-text-primary mb-4">Page Not Found</h2>
      <p className="text-text-secondary mb-8 max-w-md">
        Oops! The page you are looking for doesn't exist or has been moved to another universe.
      </p>
      <Link
        to={ROUTES.HOME}
        className="bg-secondary text-surface font-bold px-8 py-4 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xl"
      >
        Go Back Home
      </Link>
    </div>
  );
}
