import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPayment as confirmPaymentApi } from '../api/payment';
import { removeFromCart } from '../api/cart';
import { getPdfFull } from '../api/pdf';

function StepIndicator() {
  const steps = ['장바구니', '구매/결제', '결제완료'];

  return (
    <div className="hidden sm:flex items-start">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = idx < 2;

        return (
          <div key={idx} className="flex items-start">
            <div className="flex flex-col gap-2" style={{ width: 120 }}>
              <div className="flex items-center w-full py-0.5">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#256EF4] flex items-center justify-center">
                  {isCompleted ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-[#256EF4] border-[1.6px] border-white" />
                  )}
                </div>
                {!isLast && <div className="flex-1 h-px bg-[#CDD1D5]" />}
              </div>
              <span className="text-left w-full text-[15px] font-bold leading-[1.5em] text-[#1E2124]"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', paddingRight: 24 }}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentSuccessContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirmedRef = useRef(false);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [downloadingAll, setDownloadingAll] = useState(false);

  const downloadSingle = async (publicationId: string, title: string): Promise<void> => {
    const { url } = await getPdfFull(publicationId);
    const S3_HOST = 'https://newnonmun-archive.s3.ap-northeast-2.amazonaws.com';
    const h = window.location.hostname;
    const useProxy = h === 'localhost' || h === '127.0.0.1'
      || /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
    const fetchUrl = useProxy ? url.replace(S3_HOST, '/s3-proxy') : url;
    const pdfRes = await fetch(fetchUrl);
    if (!pdfRes.ok) throw new Error('PDF 다운로드에 실패했습니다.');
    const blob = await pdfRes.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const handleDownload = async (publicationId: string, title: string, idx: number) => {
    setDownloading(prev => ({ ...prev, [idx]: true }));
    try {
      await downloadSingle(publicationId, title);
    } catch (err) {
      alert(err instanceof Error ? err.message : '다운로드에 실패했습니다.');
    } finally {
      setDownloading(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleDownloadAll = async () => {
    const items = (paymentData?.items ?? []) as any[];
    const downloadableItems = items.filter((item: any) => item.publication_id);
    if (downloadableItems.length === 0) {
      alert('다운로드 가능한 논문이 없습니다.');
      return;
    }
    setDownloadingAll(true);
    try {
      for (const item of downloadableItems) {
        await downloadSingle(item.publication_id, item.title);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '다운로드에 실패했습니다.');
    } finally {
      setDownloadingAll(false);
    }
  };

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const handleConfirmPayment = async () => {
      try {
        const result = await confirmPaymentApi({
          payment_key: paymentKey,
          order_id: orderId,
          amount: parseInt(amount),
        });

        setPaymentData({
          paymentKey: result.payment.payment_key,
          orderId: result.order.order_id,
          orderName: result.order.order_name,
          method: result.payment.method,
          status: result.payment.status,
          totalAmount: result.payment.total_amount,
          virtualAccount: result.payment.virtual_account,
          items: result.order.items || [],
        });

        const pendingIds = sessionStorage.getItem('pendingCartItemIds');
        if (pendingIds) {
          const ids = JSON.parse(pendingIds) as number[];
          await Promise.allSettled(ids.map((id) => removeFromCart(id)));
          sessionStorage.removeItem('pendingCartItemIds');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '결제 승인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handleConfirmPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#256EF4] mx-auto" />
          <p className="mt-4 text-[#464C53] text-[17px]">결제 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-[#CDD1D5] rounded-xl p-8 sm:p-12 max-w-[480px] w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl sm:text-[24px] font-bold text-[#131416] mb-2"
            style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
            오류 발생
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#464C53]">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-8 py-3 rounded-lg bg-[#256EF4] border-none text-white font-bold text-[17px] cursor-pointer"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const articleItems: { title: string; authors?: string; publisher?: string; price?: number }[] =
    paymentData?.items?.length > 0
      ? paymentData.items
      : [{ title: paymentData?.orderName || '' }];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="flex justify-center py-6 sm:py-10 px-0">
        <div className="w-full max-w-[1280px] px-4">

          {/* 브레드크럼 */}
          <div className="pb-6 sm:pb-8 flex items-center gap-1">
            <button onClick={() => navigate('/')} className="bg-transparent border-none cursor-pointer p-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="#1E2124" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-[15px] text-[#1E2124] underline cursor-pointer" onClick={() => navigate('/')}>홈</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#1E2124" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[15px] text-[#1E2124] underline">결제완료</span>
          </div>

          {/* 타이틀 + 스텝 인디케이터 */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-[40px] font-bold leading-[1.5em] text-[#131416] m-0"
              style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
              결제완료
            </h1>
            <StepIndicator />
          </div>

          {/* 감사 안내 메시지 */}
          <div className="bg-[#EEF2F7] rounded-xl p-4 sm:p-6 mb-4">
            <p className="text-sm sm:text-[19px] leading-[1.5em] text-[#1E2124] m-0"
              style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
              이용해 주셔서 감사합니다.<br />
              결제하신 논문은 마이페이지 &gt; 구매 내역에서 5일간 다운로드 받으실 수 있습니다.
            </p>
          </div>

          {/* 논문 리스트 카드 */}
          <div className="bg-white border border-[#CDD1D5] rounded-xl p-5 sm:p-8 flex flex-col gap-6 w-full box-border">

            {/* 상단: 안내 텍스트 + 버튼들 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <p className="text-sm sm:text-[19px] leading-[1.5em] text-[#1E2124] m-0"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                다운로드는 결제 후 5일 동안만 가능하오니 이용에 참고 부탁드립니다.
              </p>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <button
                  onClick={() => navigate('/mypage/orders/')}
                  className="h-11 sm:h-12 px-3 sm:px-4 border border-[#58616A] rounded-md bg-transparent cursor-pointer text-sm sm:text-[17px] text-[#1E2124] whitespace-nowrap"
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}
                >
                  구매내역으로 이동
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}
                  className="h-11 sm:h-12 px-3 sm:px-4 border border-[#58616A] rounded-md bg-transparent cursor-pointer text-sm sm:text-[17px] text-[#1E2124] whitespace-nowrap disabled:opacity-50"
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}
                >
                  {downloadingAll ? '다운로드 중...' : '논문 전체 다운로드'}
                </button>
              </div>
            </div>

            <div className="border-t border-dashed border-[#8A949E]" />

            {articleItems.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex items-start sm:items-center gap-4 sm:gap-20">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <p className="text-base sm:text-[19px] font-bold leading-[1.5em] text-[#1E2124] m-0"
                      style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">{item.authors || '저자'}</span>
                      {item.publishDate && (
                        <>
                          <span className="text-xs text-[#CDD1D5] mx-0.5">|</span>
                          <span className="text-sm sm:text-[15px] text-[#464C53]">{item.publishDate}</span>
                        </>
                      )}
                      {item.grade && (
                        <>
                          <span className="text-xs text-[#CDD1D5] mx-0.5">|</span>
                          <span className="text-sm sm:text-[15px] text-[#464C53]">{item.grade}</span>
                        </>
                      )}
                    </div>
                    {(item.publisher || item.journalName) && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.publisher && <span className="text-sm sm:text-[15px] text-[#464C53]">{item.publisher}</span>}
                        {item.journalName && (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                              <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-sm sm:text-[15px] text-[#464C53]">{item.journalName}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => item.publication_id && handleDownload(item.publication_id, item.title, idx)}
                    disabled={downloading[idx] || !item.publication_id}
                    title="PDF 다운로드"
                    className="inline-flex items-center justify-center w-[48px] h-[48px] rounded-[6px] border border-[#CDD1D5] hover:bg-[#F0F2F5] transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {downloading[idx] ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E2124]" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 3v10M6 9l4 4 4-4" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 15h12" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>

                {idx < articleItems.length - 1 && (
                  <div className="border-t border-dashed border-[#8A949E] mt-6" />
                )}
              </div>
            ))}
          </div>

          {/* 가상계좌 정보 */}
          {paymentData?.virtualAccount && (
            <div className="mt-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-5 sm:p-8 w-full box-border">
              <h3 className="text-base sm:text-[19px] font-bold text-[#92400E] mb-4"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                🏦 가상계좌 정보
              </h3>
              <div className="bg-white rounded-lg p-4 sm:p-6">
                {[
                  { label: '은행', value: paymentData.virtualAccount.bankCode === '06' ? '국민은행' : paymentData.virtualAccount.bankCode },
                  { label: '계좌번호', value: paymentData.virtualAccount.accountNumber },
                  { label: '입금 기한', value: new Date(paymentData.virtualAccount.dueDate).toLocaleString('ko-KR') },
                  { label: '예금주', value: paymentData.virtualAccount.customerName },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-[#E5E7EB]">
                    <span className="text-sm sm:text-[15px] text-[#464C53]">{label}</span>
                    <span className="text-sm sm:text-[15px] font-semibold text-[#131416]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm sm:text-[15px] text-[#92400E]">
                ⚠️ 위 계좌로 입금하시면 자동으로 결제가 완료됩니다.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#256EF4]" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
