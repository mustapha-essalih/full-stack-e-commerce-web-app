import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import CatalogPage from '../pages/CatalogPage';
import CategoryPage from '../pages/CategoryPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <div className="flex min-h-[60vh] items-center justify-center text-2xl font-bold text-secondary-900">Pharos Commerce</div>,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'email/verify',
        element: <EmailVerificationPage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'category/:slug',
        element: <CategoryPage />,
      },
      {
        path: 'product/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'orders/:uuid/confirmation',
        element: <OrderConfirmationPage />,
      },
      {
        path: 'account',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <div className="flex min-h-[60vh] items-center justify-center text-xl">My Account</div>,
          },
        ],
      },
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            index: true,
            element: <div className="flex min-h-[60vh] items-center justify-center text-xl">Admin Dashboard</div>,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
