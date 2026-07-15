import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import {
  POPULAR_PAPERS_KEY,
  FEATURED_VENUES_KEY,
  fetchPopularPapers,
  fetchFeaturedVenues,
} from './api/home';
import './globals.css';

// ponytail: devtools는 개발 빌드에서만 로드 — 프로덕션 번들에서 제외됨 (import.meta.env.DEV가 false면 dead-code 제거)
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : () => null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

// 홈 API를 앱 부팅과 병렬로 미리 쏜다 → HomePage가 마운트될 땐 캐시에 이미 도착.
// fire-and-forget: 렌더를 막지 않는다. HomePage의 useQuery와 같은 key라 그대로 재사용.
queryClient.prefetchQuery({ queryKey: POPULAR_PAPERS_KEY, queryFn: fetchPopularPapers });
queryClient.prefetchQuery({ queryKey: FEATURED_VENUES_KEY, queryFn: fetchFeaturedVenues });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>
);
