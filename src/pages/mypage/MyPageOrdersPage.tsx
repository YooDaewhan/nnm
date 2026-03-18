import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import {
  getPayments, getPaymentDetail, cancelPayment,
  type OrderWithPayment, type GetPaymentsParams,
} from '../../api/payment';
import { PDF_SERVER_BASE_URL } from '../../api/client';

export default function MyPageOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<GetPaymentsParams['status'] | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 모달 상태
  const [selectedPaymentKey, setSelectedPaymentKey] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) navigate('/login');
  }, [navigate]);

  // 주문 목록 쿼리
  const { data: ordersData, isLoading, error: fetchError } = useQuery({
    queryKey: ['orders', currentPage, statusFilter],
    queryFn: () => {
      const params: GetPaymentsParams = { page: currentPage, per_page: 10 };
      if (statusFilter) params.status = statusFilter;
      return getPayments(params);
    },
    enabled: isAuthenticated(),
  });

  const orders: OrderWithPayment[] = ordersData?.success ? ordersData.orders.data : [];
  const totalPages = ordersData?.orders.last_page ?? 1;
  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '결제 내역을 불러오는데 실패했습니다.' : null;

  // 결제 상세 쿼리 (모달)
  const { data: detailData, isLoading: modalLoading, error: detailError } = useQuery({
    queryKey: ['payment-detail', selectedPaymentKey],
    queryFn: () => getPaymentDetail(selectedPaymentKey!),
    enabled: !!selectedPaymentKey,
    staleTime: 0,
  });

  const modalPayment = detailData?.success ? detailData.payment : null;
  const modalError = detailError instanceof Error
    ? detailError.message
    : !detailData?.success && detailData
      ? '결제 정보를 불러오는데 실패했습니다.'
      : null;

  // 결제 취소 뮤테이션
  const cancelMutation = useMutation({
    mutationFn: ({ paymentKey, reason }: { paymentKey: string; reason: string }) =>
      cancelPayment(paymentKey, { cancel_reason: reason }),
    onSuccess: () => {
      alert('결제가 취소되었습니다.');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => alert(err instanceof Error ? err.message : '결제 취소에 실패했습니다.'),
  });

  const openDetailModal = (paymentKey: string) => {
    setSelectedPaymentKey(paymentKey);
    setShowCancelModal(false);
    setCancelReason('');
  };

  const closeModal = () => {
    setSelectedPaymentKey(null);
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleCancelPayment = () => {
    if (!cancelReason.trim()) { alert('취소 사유를 입력해주세요.'); return; }
    if (!modalPayment) return;
    cancelMutation.mutate({ paymentKey: modalPayment.payment_key, reason: cancelReason });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': case 'DONE': return '결제 완료';
      case 'pending': case 'WAITING_FOR_DEPOSIT': return '결제 대기';
      case 'cancelled': case 'CANCELED': return '취소됨';
      case 'PARTIAL_CANCELED': return '부분 취소';
      case 'failed': return '결제 실패';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'DONE': return 'bg-[#EAF6EC] text-[#267337]';
      case 'pending': case 'WAITING_FOR_DEPOSIT': return 'bg-[#FEF3E2] text-[#B95000]';
      case 'cancelled': case 'CANCELED': case 'PARTIAL_CANCELED': case 'failed': return 'bg-[#FEE9E7] text-[#D32F2F]';
      default: return 'bg-[#EEF2F7] text-[#464C53]';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading && orders.length === 0) {
    return (
      <MypageLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#256EF4]" />
        </div>
      </MypageLayout>
    );
  }

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="flex flex-col gap-8">

        {/* ── Title Section ── */}
        <div className="bg-white rounded-xl p-8 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4">
            <h1 className="text-[32px] font-bold leading-[1.5em] tracking-[0.03125em] text-[#1E2124] shrink-0">
              구매 내역
            </h1>
            <p className="text-[19px] leading-[1.5em] text-[#1E2124]">
              구매하신 논문은 결제일로부터 5일간 다운로드하실 수 있습니다.
            </p>
          </div>
          <div className="border-t-2 border-[#1E2124]" />
          <div className="flex gap-[10px]">
            <div className="relative w-[150px]">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value as GetPaymentsParams['status'] | ''); setCurrentPage(1); }}
                className="w-full h-[56px] pl-4 pr-10 border border-[#58616A] rounded-lg text-[19px] leading-[1.5em] text-[#464C53] bg-white appearance-none focus:outline-none cursor-pointer"
              >
                <option value="">3개월</option>
                <option value="">6개월</option>
                <option value="">1년</option>
                <option value="paid">결제 완료</option>
                <option value="pending">결제 대기</option>
                <option value="cancelled">취소됨</option>
                <option value="failed">결제 실패</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#58616A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2 px-4 bg-[#F4F5F6] rounded-lg h-[56px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#8A949E" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="#8A949E" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="검색어를 입력해주세요."
                className="flex-1 bg-transparent text-[17px] leading-[1.5em] text-[#1E2124] placeholder-[#8A949E] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-[#FEE9E7] border border-[#D32F2F] text-[#D32F2F] px-6 py-4 rounded-xl text-[15px]">{error}</div>
        )}

        {/* ── 주문 목록 ── */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#256EF4]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-[17px] text-[#464C53] mb-4">구매내역이 없습니다.</p>
            <button onClick={() => navigate('/')} className="text-[17px] text-[#256EF4] hover:underline font-medium">상품 둘러보기</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => {
              const items: any[] = (order as any).metadata?.items ?? [];
              return (
                <div key={order.id} className="bg-white rounded-xl overflow-hidden">

                  {/* 헤더 영역 - 클릭 시 결제 상세 모달 */}
                  <div
                    className="flex items-center justify-between gap-6 px-8 py-5 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                    onClick={() => order.latest_payment?.payment_key && openDetailModal(order.latest_payment.payment_key)}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-[19px] font-bold leading-[1.5em] text-[#131416]">
                        {new Date(order.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] leading-[1.5em] text-[#464C53]">구매번호</span>
                        <span className="text-[15px] leading-[1.5em] text-[#464C53]">{order.order_id}</span>
                        <button
                          onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(order.order_id); alert('복사되었습니다.'); }}
                          className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="4" width="8" height="9" rx="1" stroke="#8A949E" strokeWidth="1.4" fill="white" />
                            <rect x="4" y="1" width="8" height="9" rx="1" stroke="#8A949E" strokeWidth="1.4" fill="white" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 h-6 flex items-center text-[15px] leading-[1.5em] rounded ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                        <path d="M1 1l6 6-6 6" stroke="#464C53" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="border-t border-[#CDD1D5] mx-8" />

                  {/* 논문 목록 영역 */}
                  <div className="px-8 py-5 flex flex-col gap-0">
                    {items.length > 0 ? (
                      items.map((item: any, i: number) => (
                        <div key={i}>
                          {i > 0 && <div className="border-t border-dashed border-[#CDD1D5] my-4" />}
                          <ArticleRow
                            title={item.title ?? order.order_name}
                            paperId={item.publication_id ?? item.paper_id ?? item.id}
                            authors={item.authors}
                            publishDate={item.publish_date}
                            kci={item.kci}
                            publisher={item.publisher}
                            journal={item.journal}
                            volume={item.volume}
                            pages={item.pages}
                            price={item.price ?? order.amount}
                          />
                        </div>
                      ))
                    ) : (
                      <ArticleRow
                        title={order.order_name}
                        price={order.amount}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] disabled:opacity-40 hover:bg-[#F4F5F6]">이전</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-4 py-2 border rounded-lg text-[15px] ${currentPage === page ? 'bg-[#256EF4] text-white border-[#256EF4]' : 'border-[#CDD1D5] text-[#1E2124] hover:bg-[#F4F5F6]'}`}>{page}</button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-4 py-2 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] disabled:opacity-40 hover:bg-[#F4F5F6]">다음</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 주문 상세 모달 ── */}
      {(selectedPaymentKey) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={closeModal}
        >
          <div
            className="bg-[#EEF2F7] rounded-xl p-10 flex flex-col gap-8 w-[520px] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 제목 */}
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-bold leading-[1.5em] text-[#1E2124] flex-1 text-center">
                주문 상세 정보
              </h2>
              <button onClick={closeModal} className="text-[#464C53] hover:text-[#1E2124] shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#464C53" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {modalLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#256EF4]" />
              </div>
            )}

            {modalError && (
              <div className="bg-[#FEE9E7] text-[#D32F2F] px-4 py-3 rounded-lg text-[15px]">{modalError}</div>
            )}

            {modalPayment && !modalLoading && (
              <>
                {/* 주문번호 섹션 */}
                <div className="bg-white rounded-xl p-4 flex flex-col gap-1">
                  <p className="text-[15px] leading-[1.5em] text-[#464C53]">
                    {new Date((modalPayment as any).approved_at || (modalPayment as any).requested_at || '').toLocaleString('ko-KR')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">구매번호</span>
                    <span className="text-[17px] leading-[1.5em] text-[#1E2124]">{modalPayment.order.order_id}</span>
                  </div>
                </div>

                {/* 구매 논문 섹션 */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[19px] font-bold leading-[1.5em] text-[#1E2124]">구매 논문</h3>
                  <div className="bg-white rounded-xl p-4 flex flex-col gap-5">
                    {((modalPayment.order as any).metadata?.items?.length > 0
                      ? (modalPayment.order as any).metadata.items
                      : [{ title: modalPayment.order.order_name, price: modalPayment.total_amount }]
                    ).map((item: any, i: number) => (
                      <div key={i}>
                        {i > 0 && <div className="border-t border-dashed border-[#CDD1D5] mb-5" />}
                        <div className="flex flex-col gap-1">
                          <p className="text-[15px] font-bold leading-[1.5em] text-[#1E2124]">{item.title}</p>
                          <p className="text-[15px] font-bold leading-[1.5em] text-[#131416]">{(item.price ?? 0).toLocaleString()}원</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 결제 정보 섹션 */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[19px] font-bold leading-[1.5em] text-[#1E2124]">결제 정보</h3>
                  <div className="bg-white rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[17px] font-bold leading-[1.5em] text-[#1E2124]">결제 금액</span>
                      <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">총 {modalPayment.total_amount.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[17px] font-bold leading-[1.5em] text-[#1E2124]">결제 방법</span>
                      <span className="text-[17px] font-bold leading-[1.5em] text-[#131416]">{modalPayment.method}</span>
                    </div>
                    {(modalPayment as any).card && (
                      <div className="flex justify-end items-center gap-2">
                        <span className="text-[15px] leading-[1.5em] text-[#1E2124]">{(modalPayment as any).card.issuerCode ?? ''}</span>
                        <span className="text-[15px] leading-[1.5em] text-[#131416]">{(modalPayment as any).card.number ?? ''}</span>
                        <span className="text-[15px] leading-[1.5em] text-[#131416]">{(modalPayment as any).card.installmentPlanMonths === 0 ? '일시불' : `${(modalPayment as any).card.installmentPlanMonths}개월`}</span>
                      </div>
                    )}
                    <button
                      onClick={() => (modalPayment as any).receipt?.url && window.open((modalPayment as any).receipt.url, '_blank')}
                      className="w-full h-12 border border-[#58616A] rounded-lg text-[17px] leading-[1.5em] text-[#1E2124] hover:bg-[#F4F5F6] transition-colors"
                    >
                      영수증 출력
                    </button>
                  </div>
                </div>

                {/* 결제 취소 버튼 */}
                {(modalPayment.status === 'DONE' || modalPayment.status === 'paid') && !showCancelModal && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full h-12 border border-[#D32F2F] text-[#D32F2F] rounded-lg text-[17px] hover:bg-[#FEE9E7] transition-colors"
                  >
                    결제 취소
                  </button>
                )}

                {/* 취소 사유 입력 */}
                {showCancelModal && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[15px] text-[#464C53]">정말로 결제를 취소하시겠습니까? 취소된 결제는 복구할 수 없습니다.</p>
                    <textarea
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      placeholder="취소 사유를 입력해주세요"
                      rows={3}
                      className="w-full px-4 py-3 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] placeholder-[#8A949E] focus:outline-none focus:border-[#256EF4] resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                        disabled={cancelMutation.isPending}
                        className="flex-1 h-12 border border-[#CDD1D5] rounded-lg text-[17px] text-[#464C53] hover:bg-[#F4F5F6] disabled:opacity-40"
                      >
                        닫기
                      </button>
                      <button
                        onClick={handleCancelPayment}
                        disabled={cancelMutation.isPending}
                        className="flex-1 h-12 bg-[#D32F2F] text-white rounded-lg text-[17px] hover:bg-[#B71C1C] disabled:opacity-40"
                      >
                        {cancelMutation.isPending ? '취소 중...' : '결제 취소'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </MypageLayout>
  );
}

/* ── ArticleRow 컴포넌트 ── */
interface ArticleRowProps {
  title: string;
  paperId?: string | number;
  authors?: string[];
  publishDate?: string;
  kci?: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  pages?: string;
  price?: number;
}

function ArticleRow({ title, paperId, authors, publishDate, kci, publisher, journal, volume, pages, price }: ArticleRowProps) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const handleMetaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (paperId) navigate(`/papers?id=${paperId}`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!paperId) return;
    setDownloading(true);
    try {
      const res = await fetch(`${PDF_SERVER_BASE_URL}/api/documents/${paperId}/file`);
      if (!res.ok) throw new Error('다운로드 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
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
        className={`flex-1 flex flex-col gap-1 min-w-0 ${paperId ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
        onClick={paperId ? handleMetaClick : undefined}
      >
        <h3 className="text-[19px] font-bold leading-[1.5em] text-[#1E2124]">{title}</h3>
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
      </div>
      {price !== undefined && (
        <span className="shrink-0 text-[17px] font-bold leading-[1.5em] text-[#131416]">{price.toLocaleString()}원</span>
      )}
      <div className="shrink-0">
        <button
          onClick={handleDownload}
          disabled={downloading || !paperId}
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
