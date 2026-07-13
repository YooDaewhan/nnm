import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NO_CHROME_PATHS = ['/login', '/register', '/auth'];

export default function RootLayout() {
  const location = useLocation();
  const hideChrome = NO_CHROME_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      {!hideChrome && <Header />}
      <div className="flex flex-col flex-1 w-full">
        <Suspense fallback={<div className="flex-1 min-h-[50vh]" />}>
          <Outlet />
        </Suspense>
      </div>
      {!hideChrome && <Footer />}
    </div>
  );
}
