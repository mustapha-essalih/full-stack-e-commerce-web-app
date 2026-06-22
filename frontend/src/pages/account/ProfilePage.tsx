import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile, useUpdatePassword } from '../../hooks/useAccount';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: 'Passwords do not match',
  path: ['new_password_confirmation'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? { name: profile.name, email: profile.email } : undefined,
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  });

  async function onProfileSubmit(data: ProfileForm) {
    setProfileError(null);
    try {
      await updateProfileMutation.mutateAsync(data);
      addToast('Profile updated successfully.', 'success');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        setProfileError(axiosErr.response?.data?.message ?? 'Failed to update profile.');
      } else {
        setProfileError('An unexpected error occurred.');
      }
    }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPasswordError(null);
    try {
      await updatePasswordMutation.mutateAsync(data);
      addToast('Password updated successfully.', 'success');
      passwordForm.reset();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        if (axiosErr.response?.data?.errors) {
          const firstError = Object.values(axiosErr.response.data.errors)[0]?.[0];
          setPasswordError(firstError ?? 'Failed to update password.');
        } else {
          setPasswordError(axiosErr.response?.data?.message ?? 'Failed to update password.');
        }
      } else {
        setPasswordError('An unexpected error occurred.');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="h-8 w-48 rounded bg-secondary-200" />
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-secondary-200" />
          <div className="h-10 w-full rounded bg-secondary-200" />
          <div className="h-4 w-32 rounded bg-secondary-200" />
          <div className="h-10 w-full rounded bg-secondary-200" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600">
        Failed to load profile. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-secondary-900">Profile Information</h2>

        {profileError && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">{profileError}</div>
        )}

        {profile && !profile.email_verified_at && (
          <div className="mb-4 rounded-md bg-warning-50 p-3 text-sm text-warning-700">
            Your email is not verified.{' '}
            <Link to="/email/verify" className="font-medium underline hover:text-warning-800">
              Resend verification email
            </Link>
          </div>
        )}

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-700">Name</label>
            <input
              id="name"
              type="text"
              {...profileForm.register('name')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {profileForm.formState.errors.name && (
              <p className="mt-1 text-xs text-danger-600">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary-700">Email</label>
            <input
              id="email"
              type="email"
              {...profileForm.register('email')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {profileForm.formState.errors.email && (
              <p className="mt-1 text-xs text-danger-600">{profileForm.formState.errors.email.message}</p>
            )}

            <p className="mt-1 text-xs text-secondary-400">
              Changing your email will require re-verification.
            </p>
          </div>

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-secondary-900">Change Password</h2>

        {passwordError && (
          <div className="mb-4 rounded-md bg-danger-50 p-3 text-sm text-danger-600">{passwordError}</div>
        )}

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-secondary-700">
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              {...passwordForm.register('current_password')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {passwordForm.formState.errors.current_password && (
              <p className="mt-1 text-xs text-danger-600">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-secondary-700">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              {...passwordForm.register('new_password')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {passwordForm.formState.errors.new_password && (
              <p className="mt-1 text-xs text-danger-600">{passwordForm.formState.errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-secondary-700">
              Confirm New Password
            </label>
            <input
              id="new_password_confirmation"
              type="password"
              {...passwordForm.register('new_password_confirmation')}
              className="mt-1 block w-full rounded-md border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {passwordForm.formState.errors.new_password_confirmation && (
              <p className="mt-1 text-xs text-danger-600">
                {passwordForm.formState.errors.new_password_confirmation.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
