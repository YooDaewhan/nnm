import { useState, useEffect, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { createOrder } from '../api/payment';
import { getCart, type CartItem } from '../api/cart';
import TermsModal from '../components/pay/TermsModal';

declare global {
  interface Window {
    TossPayments: any;
  }
}

const loadTossPaymentsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.TossPayments !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('토스 SDK 로드 실패'));
    document.head.appendChild(script);
  });
};

type PaymentMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER';

function StepIndicator() {
  const steps = ['장바구니', '구매/결제', '결제완료'];
  const currentStep = 1;

  return (
    <div className="hidden sm:flex items-center gap-0">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isOngoing = idx === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-2" style={{ width: 120 }}>
              <div className="flex items-center w-full" style={{ height: 20 }}>
                {isCompleted ? (
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-full w-5 h-5 bg-[#256EF4]">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {!isLast && <div className="flex-1 h-px bg-[#CDD1D5]" />}
                  </div>
                ) : isOngoing ? (
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 flex items-center justify-center rounded-full w-5 h-5 bg-[#256EF4]">
                      <div className="rounded-full w-3.5 h-3.5 bg-[#256EF4] border-[1.6px] border-white" />
                    </div>
                    {!isLast && <div className="flex-1 h-px bg-[#CDD1D5]" />}
                  </div>
                ) : (
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 rounded-full w-5 h-5 bg-[#E6E8EA] border border-[#CDD1D5]" />
                    {!isLast && <div className="flex-1 h-px bg-[#CDD1D5]" />}
                  </div>
                )}
              </div>
              <span
                className="text-left w-full text-[15px] font-bold leading-[1.5em] text-[#1E2124]"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', paddingRight: 24 }}
              >
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PayPageContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDirect = searchParams.get('direct') === 'true';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login?redirect=/pay'); return; }
    setAuthChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;

    if (isDirect) {
      try {
        const raw = sessionStorage.getItem('directBuyItem');
        if (raw) {
          const item = JSON.parse(raw);
          setCartItems([{ id: 0, subtotal: item.unit_price * item.quantity, ...item }]);
        } else {
          setError('구매 정보를 찾을 수 없습니다.');
        }
      } catch {
        setError('구매 정보를 불러오는데 실패했습니다.');
      }
      setCartLoading(false);
    } else {
      getCart()
        .then((items) => {
          if (items.length === 0) setError('장바구니가 비어있습니다.');
          setCartItems(items);
        })
        .catch((err) => {
          console.error('장바구니 조회 실패:', err);
          if (err.message === '인증이 필요합니다.' || err.message === '인증되지 않았습니다.') {
            navigate('/login?redirect=/pay');
          } else {
            setError(err.message || '장바구니 조회에 실패했습니다.');
          }
        })
        .finally(() => setCartLoading(false));
    }

    loadTossPaymentsScript()
      .then(() => setSdkLoaded(true))
      .catch((err) => {
        console.error('SDK 로드 실패:', err);
        setError('결제 시스템을 불러오는데 실패했습니다.');
      });
  }, [authChecked, navigate, isDirect]);

  const displayItems = cartItems;
  const totalAmount = displayItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handlePayment = async () => {
    if (displayItems.length === 0) { setError('결제할 상품이 없습니다.'); return; }
    if (totalAmount === 0) { setError('결제할 상품을 선택해주세요.'); return; }
    if (!sdkLoaded) { setError('결제 시스템이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'); return; }

    setLoading(true);
    setError(null);

    try {
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error('토스 결제 클라이언트 키가 설정되지 않았습니다.');
      if (typeof window.TossPayments === 'undefined') throw new Error('토스 결제 SDK가 로드되지 않았습니다.');

      const firstItem = displayItems[0].title;
      const orderName = displayItems.length > 1 ? `${firstItem} 외 ${displayItems.length - 1}건` : firstItem;

      console.log('[PayPage] displayItems:', displayItems.map(i => ({ id: i.id, publication_id: i.publication_id, title: i.title })));

      const orderResponse = await createOrder({
        order_name: orderName,
        amount: totalAmount,
        metadata: {
          items: displayItems.map(item => ({
            title: item.title,
            price: item.unit_price * item.quantity,
            publication_id: item.publication_id,
          })),
        },
      });
      const orderId = orderResponse.order.order_id;
      const customerKey = `customer_${Date.now()}`;

      if (!isDirect) {
        sessionStorage.setItem('pendingCartItemIds', JSON.stringify(displayItems.map((item) => item.id)));
      }

      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey });

      await payment.requestPayment({
        method: paymentMethod,
        amount: { currency: 'KRW', value: totalAmount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: '사용자',
      });
      if (isDirect) sessionStorage.removeItem('directBuyItem');
    } catch (err) {
      console.error('결제 오류:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked || cartLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#256EF4] mx-auto" />
          <p className="mt-4 text-[#464C53]">
            {!authChecked ? '로그인 확인 중...' : '장바구니 불러오는 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="flex justify-center py-6 sm:py-10 px-0">
        <div className="w-full max-w-[1280px] px-4">

          {/* 브레드크럼 */}
          <div className="pb-6 sm:pb-8">
            <span className="text-sm text-[#8A949E]">홈</span>
            <span className="text-sm text-[#8A949E] mx-1">/</span>
            <span className="text-sm text-[#131416] font-semibold">구매/결제</span>
          </div>

          {/* 타이틀 + 스텝 인디케이터 */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-[40px] font-bold leading-[1.5em] text-[#131416] m-0"
              style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
              구매/결제
            </h1>
            <StepIndicator />
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch">

              {/* 좌측: 결제 논문 목록 */}
              <div className="flex-1 flex flex-col gap-2">
                <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416] m-0"
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                  결제 논문
                </h2>

                <div className="bg-white border border-[#CDD1D5] rounded-xl p-5 sm:p-8 flex flex-col gap-6 min-h-[200px] sm:min-h-[362px]">
                  {displayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3">
                      <p className="text-[#8A949E] text-[17px]">장바구니가 비어있습니다.</p>
                      <button
                        onClick={() => navigate('/cart')}
                        className="text-[#256EF4] text-[15px] font-semibold bg-transparent border-none cursor-pointer"
                      >
                        장바구니로 돌아가기
                      </button>
                    </div>
                  ) : (
                    <>
                      {displayItems.map((item, idx) => (
                        <div key={item.id}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-20">
                            <div className="flex-1 flex flex-col gap-1 min-w-0">
                              <p className="text-base sm:text-[19px] font-bold leading-[1.5em] text-[#1E2124] m-0"
                                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">저자</span>
                                <span className="text-xs text-[#CDD1D5]">|</span>
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">{item.unit_price.toLocaleString()}원</span>
                                <span className="text-xs text-[#CDD1D5] mx-0.5">|</span>
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">수량 {item.quantity}개</span>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">발행기관</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                  <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">저널명</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                  <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-sm sm:text-[15px] text-[#464C53] leading-[1.5em]">KCI등재</span>
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:justify-center gap-2 self-end sm:self-auto">
                              <span className="text-base sm:text-[17px] font-bold leading-[1.5em] text-[#131416] whitespace-nowrap"
                                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                                {(item.unit_price * item.quantity).toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          {idx < displayItems.length - 1 && (
                            <div className="border-t border-dashed border-[#8A949E] mt-6" />
                          )}
                        </div>
                      ))}

                      <div className="border-t border-dashed border-[#8A949E]" />

                      <div className="flex justify-end items-center gap-2 px-2.5">
                        <span className="text-base sm:text-[19px] font-bold leading-[1.5em] text-[#131416]"
                          style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                          총 결제금액
                        </span>
                        <span className="text-base sm:text-[19px] font-bold leading-[1.5em] text-[#131416]"
                          style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                          {totalAmount.toLocaleString()}원
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 우측: 결제 수단 */}
              <div className="w-full lg:w-[460px] flex flex-col gap-2 flex-shrink-0">
                <h2 className="text-xl sm:text-[24px] font-bold leading-[1.5em] text-[#131416] m-0"
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                  결제 수단
                </h2>

                <div className="bg-white border border-[#CDD1D5] rounded-xl p-5 sm:p-8 flex flex-col gap-6">
                  <div className="flex gap-0">
                    {[
                      { label: '신용카드', value: 'CARD' as PaymentMethod },
                      { label: '가상계좌', value: 'VIRTUAL_ACCOUNT' as PaymentMethod },
                      { label: '휴대폰', value: 'TRANSFER' as PaymentMethod },
                    ].map(({ label, value }) => {
                      const isActive = paymentMethod === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setPaymentMethod(value)}
                          className={`flex-1 h-12 px-2 sm:px-4 border border-[#58616A] rounded-md mx-1 text-sm sm:text-[17px] leading-[1.5em] text-[#1E2124] cursor-pointer transition-colors ${isActive ? 'bg-[#F4F5F6]' : 'bg-transparent'}`}
                          style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'CARD' && (
                    <p className="text-sm sm:text-[15px] text-[#8A949E] m-0 leading-[1.5em]">신용카드 결제를 이용하여 결제할 수 있습니다.</p>
                  )}
                  {paymentMethod === 'VIRTUAL_ACCOUNT' && (
                    <p className="text-sm sm:text-[15px] text-[#8A949E] m-0 leading-[1.5em]">가상계좌 결제를 이용하여 결제할 수 있습니다.</p>
                  )}
                  {paymentMethod === 'TRANSFER' && (
                    <p className="text-sm sm:text-[15px] text-[#8A949E] m-0 leading-[1.5em]">휴대폰 소액결제를 이용하여 결제할 수 있습니다.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 하단: 약관 동의 + 결제 버튼 */}
            {displayItems.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-[#CDD1D5] rounded-xl p-5 sm:p-8 gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <label className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer">
                    <button
                      onClick={() => setAgreed(!agreed)}
                      className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer flex-shrink-0 p-0.5 border ${agreed ? 'bg-[#256EF4] border-transparent' : 'bg-white border-[#CDD1D5]'}`}
                      style={{ borderWidth: agreed ? 0 : 1.5 }}
                    >
                      {agreed && (
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                          <path d="M1.5 5L5.5 9L12.5 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                    <span className="text-sm sm:text-[19px] font-bold leading-[1.5em] text-[#131416]"
                      style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                      주문 상품정보 및 결제대행 서비스 이용약관에 모두 동의하십니까?
                    </span>
                  </label>
                  <span
                    onClick={() => setTermsModalOpen(true)}
                    className="text-sm sm:text-[17px] leading-[1.5em] text-[#131416] underline cursor-pointer whitespace-nowrap flex-shrink-0"
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}
                  >
                    약관보기
                  </span>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 w-full sm:w-auto">
                    <p className="text-red-800 text-[15px] m-0">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!agreed) { alert('상품정보 및 서비스 이용약관에 동의해주세요.'); return; }
                    handlePayment();
                  }}
                  disabled={loading || totalAmount === 0}
                  className={`w-full sm:w-[300px] h-14 sm:h-16 rounded-lg border-none flex items-center justify-center flex-shrink-0 transition-colors ${loading || totalAmount === 0 || !agreed ? 'bg-[#CDD1D5] cursor-not-allowed' : 'bg-[#256EF4] cursor-pointer'}`}
                >
                  <span className="text-lg sm:text-[24px] font-bold leading-[1.5em] text-white"
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}>
                    {loading ? '처리 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
                  </span>
                </button>
              </div>
            )}

            <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />

            {displayItems.length === 0 && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 m-0">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#256EF4]" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
