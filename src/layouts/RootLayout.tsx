import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NO_CHROME_PATHS = ['/login', '/register', '/auth'];

export default function RootLayout() {
  const location = useLocation();
  const hideChrome = NO_CHROME_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      {!hideChrome && <Header />}
      <div className="flex flex-col flex-1">
        <Outlet />
      </div>
      {!hideChrome && <Footer />}
    </div>
  );
}
