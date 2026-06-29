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
import JournalPage from '@/pages/JournalPage';
import MyPageInfoPage from '@/pages/mypage/MyPageInfoPage';
import MyPageOrdersPage from '@/pages/mypage/MyPageOrdersPage';
import MyPageLibraryPage from '@/pages/mypage/MyPageLibraryPage';
import MyPageRecentPage from '@/pages/mypage/MyPageRecentPage';
import MyPageScrapPage from '@/pages/mypage/MyPageScrapPage';
import MyPageQnaPage from '@/pages/mypage/MyPageQnaPage';

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
