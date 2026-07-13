import { lazy } from 'react';
import { createBrowserRouter, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';

function ErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[64px] font-bold text-[#256EF4] leading-none mb-4">
          {is404 ? '404' : '오류'}
        </p>
        <p className="text-[20px] font-bold text-[#1E2124] mb-2">
          {is404 ? '페이지를 찾을 수 없습니다.' : '오류가 발생했습니다.'}
        </p>
        <p className="text-[15px] text-[#8A949E] mb-8">
          {is404 ? '요청하신 페이지가 존재하지 않습니다.' : '잠시 후 다시 시도해주세요.'}
        </p>
        <a href="/" className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#256EF4] text-white text-[15px] font-medium hover:bg-[#1e4ec9] transition-colors">
          홈으로 이동
        </a>
      </div>
    </div>
  );
}
// 라우트별 코드 스플리팅 — 각 페이지는 방문 시점에 로드됨
const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const RegisterCompletePage = lazy(() => import('@/pages/RegisterCompletePage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const PayPage = lazy(() => import('@/pages/PayPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentFailPage = lazy(() => import('@/pages/PaymentFailPage'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const PapersPage = lazy(() => import('@/pages/PapersPage'));
const ProvidersPage = lazy(() => import('@/pages/ProvidersPage'));
const ProvidersDetailPage = lazy(() => import('@/pages/ProvidersDetailPage'));
const JournalPage = lazy(() => import('@/pages/JournalPage'));
const MyPageInfoPage = lazy(() => import('@/pages/mypage/MyPageInfoPage'));
const MyPageOrdersPage = lazy(() => import('@/pages/mypage/MyPageOrdersPage'));
const MyPageLibraryPage = lazy(() => import('@/pages/mypage/MyPageLibraryPage'));
const MyPageRecentPage = lazy(() => import('@/pages/mypage/MyPageRecentPage'));
const MyPageScrapPage = lazy(() => import('@/pages/mypage/MyPageScrapPage'));
const MyPageQnaPage = lazy(() => import('@/pages/mypage/MyPageQnaPage'));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/',                    element: <HomePage /> },
      { path: '/search',              element: <SearchPage /> },
      { path: '/library',             element: <LibraryPage /> },
      { path: '/papers/:id',          element: <PapersPage /> },
      { path: '/providers',           element: <ProvidersPage /> },
      { path: '/providers/detail',    element: <ProvidersDetailPage /> },
      { path: '/journal/:id',          element: <JournalPage /> },
      { path: '/journal',             element: <JournalPage /> },
      { path: '/cart',                element: <CartPage /> },
      { path: '/pay',                 element: <PayPage /> },
      { path: '/payment/success',     element: <PaymentSuccessPage /> },
      { path: '/payment/fail',        element: <PaymentFailPage /> },
      { path: '/mypage',              element: <MyPageInfoPage /> },
      { path: '/mypage/orders',       element: <MyPageOrdersPage /> },
      { path: '/mypage/library',      element: <MyPageLibraryPage /> },
      { path: '/mypage/scraps',       element: <MyPageScrapPage /> },
      { path: '/mypage/recent',       element: <MyPageRecentPage /> },
      { path: '/mypage/qna',          element: <MyPageQnaPage /> },
      { path: '/login',               element: <LoginPage /> },
      { path: '/register',            element: <RegisterPage /> },
      { path: '/register/complete',   element: <RegisterCompletePage /> },
      { path: '/auth/callback',       element: <AuthCallbackPage /> },

    ],
  },
]);
