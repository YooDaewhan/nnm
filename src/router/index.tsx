import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import RegisterCompletePage from '@/pages/RegisterCompletePage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import CartPage from '@/pages/CartPage';
import PayPage from '@/pages/PayPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentFailPage from '@/pages/PaymentFailPage';
import LibraryPage from '@/pages/LibraryPage';
import PapersPage from '@/pages/PapersPage';
import ProvidersPage from '@/pages/ProvidersPage';
import ProvidersDetailPage from '@/pages/ProvidersDetailPage';
import MyPageInfoPage from '@/pages/mypage/MyPageInfoPage';
import MyPageOrdersPage from '@/pages/mypage/MyPageOrdersPage';
import MyPageLibraryPage from '@/pages/mypage/MyPageLibraryPage';
import MyPageRecentPage from '@/pages/mypage/MyPageRecentPage';
import MyPageQnaPage from '@/pages/mypage/MyPageQnaPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/',                    element: <HomePage /> },
      { path: '/search',              element: <SearchPage /> },
      { path: '/library',             element: <LibraryPage /> },
      { path: '/papers/:id',                               element: <PapersPage /> },
      { path: '/papers/:provider/:venue/:journal/:id',     element: <PapersPage /> },
      { path: '/providers',           element: <ProvidersPage /> },
      { path: '/providers/detail',    element: <ProvidersDetailPage /> },
      { path: '/cart',                element: <CartPage /> },
      { path: '/pay',                 element: <PayPage /> },
      { path: '/payment/success',     element: <PaymentSuccessPage /> },
      { path: '/payment/fail',        element: <PaymentFailPage /> },
      { path: '/mypage',              element: <MyPageInfoPage /> },
      { path: '/mypage/orders',       element: <MyPageOrdersPage /> },
      { path: '/mypage/library',      element: <MyPageLibraryPage /> },
      { path: '/mypage/recent',       element: <MyPageRecentPage /> },
      { path: '/mypage/qna',          element: <MyPageQnaPage /> },
      { path: '/login',               element: <LoginPage /> },
      { path: '/register',            element: <RegisterPage /> },
      { path: '/register/complete',   element: <RegisterCompletePage /> },
      { path: '/auth/callback',       element: <AuthCallbackPage /> },
    ],
  },
]);
