import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await register(username, email, password);
      toast.success('Registration successful!');
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-surface border-3 border-text-primary p-8 shadow-neo">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Register</h1>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border-3 border-danger text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-text-primary mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-3 bg-surface border-3 border-text-primary text-text-primary focus:outline-none focus:border-secondary"
            />
          </div>

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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-text-primary mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface border-3 border-text-primary text-text-primary focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-text-primary font-bold py-3 px-4 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
