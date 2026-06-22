import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import ProtectedRoute from '../components/ProtectedRoute';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <div className="flex min-h-screen items-center justify-center text-2xl font-bold text-secondary-900">Pharos Commerce</div>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/email/verify',
    element: <EmailVerificationPage />,
  },
  {
    path: '/account',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <div className="flex min-h-screen items-center justify-center text-xl">My Account</div>,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <div className="flex min-h-screen items-center justify-center text-xl">Admin Dashboard</div>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
