import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import client from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';
import { useState } from 'react';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setError(null);
    try {
      const response = await client.post('/v1/auth/register', data);
      const { user, access_token, refresh_token } = response.data.data;
      login(access_token, refresh_token, user);
      navigate('/email/verify');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const message = axiosErr.response?.data?.errors
          ? Object.values(axiosErr.response.data.errors).flat().join(', ')
          : axiosErr.response?.data?.message ?? 'Registration failed';
        setError(message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-secondary-900">Create Account</h1>

        {error && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>
            )}
          </div>

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

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-secondary-700">
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              {...register('password_confirmation')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.password_confirmation && (
              <p className="mt-1 text-xs text-danger-600">{errors.password_confirmation.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-secondary-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
