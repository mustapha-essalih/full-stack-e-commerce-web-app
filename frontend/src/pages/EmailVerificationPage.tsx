import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuthStore } from '../stores/useAuthStore';

export default function EmailVerificationPage() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setError(null);
    try {
      await client.post('/v1/auth/email/verification-notification');
      setSent(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message ?? 'Failed to send verification email');
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-secondary-900">Verify Your Email</h1>

        <p className="mb-4 text-secondary-600">
          Thanks for creating an account{user ? `, ${user.name}` : ''}! Please check your email for a
          verification link.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">
            {error}
          </div>
        )}

        {sent && (
          <div className="mb-4 rounded-md bg-success-50 p-3 text-sm text-success-600">
            Verification email sent!
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Resend Verification Email
          </button>

          <Link
            to="/account"
            className="block text-sm text-primary-600 hover:text-primary-500"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
