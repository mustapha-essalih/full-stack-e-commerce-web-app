import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminRoute from '../components/AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import AccountLayout from '../components/account/AccountLayout';
import CatalogPage from '../pages/CatalogPage';
import CategoryPage from '../pages/CategoryPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import OrderHistoryPage from '../pages/OrderHistoryPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import AdminOrderDetailPage from '../pages/admin/OrderDetailPage';
import AdminOrderListPage from '../pages/admin/OrderListPage';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminCustomerListPage from '../pages/admin/CustomerListPage';
import AdminCustomerDetailPage from '../pages/admin/CustomerDetailPage';
import AdminProductListPage from '../pages/admin/ProductListPage';
import AdminProductFormPage from '../pages/admin/ProductFormPage';
import AdminCategoryListPage from '../pages/admin/CategoryListPage';
import AdminCategoryFormPage from '../pages/admin/CategoryFormPage';
import AddressBookPage from '../pages/account/AddressBookPage';
import ProfilePage from '../pages/account/ProfilePage';
import WishlistPage from '../pages/account/WishlistPage';
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
            element: <AccountLayout />,
            children: [
              {
                index: true,
                element: <ProfilePage />,
              },
              {
                path: 'addresses',
                element: <AddressBookPage />,
              },
              {
                path: 'wishlist',
                element: <WishlistPage />,
              },
              {
                path: 'orders',
                element: <OrderHistoryPage />,
              },
              {
                path: 'orders/:uuid',
                element: <OrderDetailPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboardPage />,
              },
              {
                path: 'products',
                element: <AdminProductListPage />,
              },
              {
                path: 'inventory',
                element: <AdminInventoryPage />,
              },
              {
                path: 'products/create',
                element: <AdminProductFormPage />,
              },
              {
                path: 'products/:id/edit',
                element: <AdminProductFormPage />,
              },
              {
                path: 'categories',
                element: <AdminCategoryListPage />,
              },
              {
                path: 'categories/create',
                element: <AdminCategoryFormPage />,
              },
              {
                path: 'categories/:id/edit',
                element: <AdminCategoryFormPage />,
              },
              {
                path: 'orders',
                element: <AdminOrderListPage />,
              },
              {
                path: 'orders/:uuid',
                element: <AdminOrderDetailPage />,
              },
              {
                path: 'customers',
                element: <AdminCustomerListPage />,
              },
              {
                path: 'customers/:uuid',
                element: <AdminCustomerDetailPage />,
              },
            ],
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
