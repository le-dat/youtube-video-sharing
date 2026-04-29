import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants/routes';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate(ROUTES.HOME);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="w-full px-4 md:px-0 md:max-w-md mx-auto mt-6 md:mt-10">
      <div className="bg-surface border-3 border-text-primary p-4 md:p-8 shadow-neo">
        <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-6">Login</h1>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border-3 border-danger text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface border-3 border-text-primary text-text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-surface border-3 border-text-primary text-text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-text-primary font-bold py-3 px-4 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-secondary font-bold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
