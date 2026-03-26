import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import { getPurchaseLibrary, type PurchaseLibraryItem } from '../../api/purchase';
import { PDF_SERVER_BASE_URL } from '../../api/client';

export default function MyPageLibraryPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login');
  }, [navigate]);

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['mypage-library', currentPage],
    queryFn: () => getPurchaseLibrary({ page: currentPage, per_page: 20 }),
    enabled: isAuthenticated(),
  });

  const items: PurchaseLibraryItem[] = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '보관함을 불러오지 못했습니다.' : null;

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="flex flex-col gap-8">

        {/* ── Title Section ── */}
        <div className="bg-white rounded-xl p-8 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4">
            <h1 className="text-[32px] font-bold leading-[1.5em] tracking-[0.03125em] text-[#1E2124] shrink-0">
              보관함
            </h1>
            <p className="text-[19px] leading-[1.5em] text-[#1E2124]">
              구매하신 논문은 결제일로부터 5일간 다운로드하실 수 있습니다.
            </p>
          </div>
          <div className="border-t-2 border-[#1E2124]" />
        </div>

        {error && (
          <div className="bg-[#FEE9E7] border border-[#D32F2F] text-[#D32F2F] px-6 py-4 rounded-xl text-[15px]">{error}</div>
        )}

        {/* ── 논문 목록 ── */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#256EF4]" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#464C53] mb-4">보관함이 비어 있습니다.</p>
            <button onClick={() => navigate('/')} className="text-[17px] text-[#256EF4] hover:underline font-medium">논문 둘러보기</button>
          </div>
        ) : (
          <div className="flex flex-col gap-0 bg-white rounded-xl overflow-hidden">
            {items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <div className="border-t border-[#F3F4F6] mx-8" />}
                <div className="px-8 py-5">
                  <LibraryRow item={item} />
                </div>
              </div>
            ))}
          </div>
        )}

        {lastPage > 1 && !isLoading && items.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] disabled:opacity-40 hover:bg-[#F4F5F6]"
            >
              이전
            </button>
            {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
              let page: number;
              if (lastPage <= 5) page = i + 1;
              else if (currentPage <= 3) page = i + 1;
              else if (currentPage >= lastPage - 2) page = lastPage - 4 + i;
              else page = currentPage - 2 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg text-[15px] ${currentPage === page ? 'bg-[#256EF4] text-white border-[#256EF4]' : 'border-[#CDD1D5] text-[#1E2124] hover:bg-[#F4F5F6]'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === lastPage}
              className="px-4 py-2 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] disabled:opacity-40 hover:bg-[#F4F5F6]"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </MypageLayout>
  );
}

/* ── LibraryRow 컴포넌트 ── */
function LibraryRow({ item }: { item: PurchaseLibraryItem }) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const authors = item.authors as string[] | undefined;
  const publishDate = item.publish_date as string | undefined;
  const kci = item.kci as string | undefined;
  const publisher = item.publisher as string | undefined;
  const journal = item.journal as string | undefined;
  const volume = item.volume as string | undefined;
  const pages = item.pages as string | undefined;

  const handleNavigate = () => {
    navigate(`/papers?id=${item.publication_id}`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const res = await fetch(`${PDF_SERVER_BASE_URL}/api/documents/${item.publication_id}/file`);
      if (!res.ok) throw new Error('다운로드 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-20">
      <div
        className="flex-1 flex flex-col gap-1 min-w-0 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={handleNavigate}
      >
        <h3 className="text-[19px] font-bold leading-[1.5em] text-[#1E2124]">{item.title}</h3>
        {(authors?.length || publishDate || kci) && (
          <div className="flex items-center flex-wrap gap-x-1 gap-y-0">
            {authors?.map((a, i) => <span key={i} className="text-[15px] leading-[1.5em] text-[#464C53]">{a}</span>)}
            {publishDate && <><Pipe /><span className="text-[15px] leading-[1.5em] text-[#464C53]">{publishDate}</span></>}
            {kci && <><Pipe /><span className="text-[15px] leading-[1.5em] text-[#464C53]">{kci}</span></>}
          </div>
        )}
        {(publisher || journal || volume || pages) && (
          <div className="flex items-center flex-wrap gap-x-1 gap-y-0">
            {publisher && <span className="text-[15px] leading-[1.5em] text-[#464C53]">{publisher}</span>}
            {journal && <><Arrow /><span className="text-[15px] leading-[1.5em] text-[#464C53]">{journal}</span></>}
            {volume && <><Arrow /><span className="text-[15px] leading-[1.5em] text-[#464C53]">{volume}</span></>}
            {pages && <><Arrow /><span className="text-[15px] leading-[1.5em] text-[#464C53]">{pages}</span></>}
          </div>
        )}
        <span className="text-[13px] text-[#9CA3AF] mt-0.5">
          구매일 {new Date(item.purchased_at).toLocaleDateString('ko-KR')}
        </span>
      </div>
      <div className="shrink-0">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-8 h-8 border border-[#CDD1D5] rounded-[6px] flex items-center justify-center hover:bg-[#F4F5F6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="다운로드"
        >
          {downloading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E2124]" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v10M5 8l4 4 4-4" stroke="#1E2124" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 15h14" stroke="#1E2124" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function Pipe() {
  return <span className="text-[#CDD1D5] text-[13px] mx-[2px] select-none">|</span>;
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-[2px] shrink-0">
      <path d="M4 7h6M7 4l3 3-3 3" stroke="#8A949E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
