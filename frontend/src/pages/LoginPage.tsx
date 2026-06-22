import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import client from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const syncWithServer = useCartStore((s) => s.syncWithServer);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      const response = await client.post('/v1/auth/login', data);
      const { user, access_token, refresh_token } = response.data.data;
      login(access_token, refresh_token, user);
      await syncWithServer();
      navigate(user.roles.includes('admin') ? '/admin' : '/account');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message ?? 'Login failed');
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-secondary-900">Sign In</h1>

        {error && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          <p>
            <Link to="/register" className="text-primary-600 hover:text-primary-500">
              Create an account
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-500">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
