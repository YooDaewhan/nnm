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

// SDK 로드 함수
const loadTossPaymentsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.TossPayments !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('토스 SDK 로드 실패'));
    document.head.appendChild(script);
  });
};

type PaymentMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER';

// 스텝 인디케이터
function StepIndicator() {
  const steps = ['장바구니', '구매/결제', '결제완료'];
  const currentStep = 1;

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isOngoing = idx === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-2" style={{ width: 120 }}>
              <div className="flex items-center w-full" style={{ height: 20 }}>
                {isCompleted ? (
                  <div className="flex items-center w-full" style={{ gap: '-1px' }}>
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 20, height: 20, background: '#256EF4' }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {!isLast && (
                      <div className="flex-1" style={{ height: 1, background: '#CDD1D5' }} />
                    )}
                  </div>
                ) : isOngoing ? (
                  <div className="flex items-center w-full" style={{ gap: '-1px' }}>
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 20, height: 20, background: '#256EF4' }}
                    >
                      <div
                        className="rounded-full"
                        style={{ width: 14, height: 14, background: '#256EF4', border: '1.6px solid #FFFFFF' }}
                      />
                    </div>
                    {!isLast && (
                      <div className="flex-1" style={{ height: 1, background: '#CDD1D5' }} />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center w-full">
                    <div
                      className="flex-shrink-0 rounded-full"
                      style={{ width: 20, height: 20, background: '#E6E8EA', border: '1px solid #CDD1D5' }}
                    />
                    {!isLast && (
                      <div className="flex-1" style={{ height: 1, background: '#CDD1D5' }} />
                    )}
                  </div>
                )}
              </div>
              <span
                className="text-left w-full"
                style={{
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  lineHeight: '1.5em',
                  color: '#1E2124',
                  paddingRight: 24,
                }}
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
    if (!isAuthenticated()) {
      navigate('/login?redirect=/pay');
      return;
    }
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
          if (items.length === 0) {
            setError('장바구니가 비어있습니다.');
          }
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
        .finally(() => {
          setCartLoading(false);
        });
    }

    loadTossPaymentsScript()
      .then(() => setSdkLoaded(true))
      .catch((err) => {
        console.error('SDK 로드 실패:', err);
        setError('결제 시스템을 불러오는데 실패했습니다.');
      });
  }, [authChecked, navigate, isDirect]);

  const displayItems = cartItems;

  const totalAmount = displayItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (displayItems.length === 0) {
      setError('결제할 상품이 없습니다.');
      return;
    }
    if (totalAmount === 0) {
      setError('결제할 상품을 선택해주세요.');
      return;
    }
    if (!sdkLoaded) {
      setError('결제 시스템이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

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
        sessionStorage.setItem(
          'pendingCartItemIds',
          JSON.stringify(displayItems.map((item) => item.id))
        );
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
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#256EF4' }}></div>
            <p className="mt-4" style={{ color: '#464C53' }}>
              {!authChecked ? '로그인 확인 중...' : '장바구니 불러오는 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <main style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <div style={{ width: 1280, padding: '0 16px' }}>

          {/* 브레드크럼 */}
          <div style={{ paddingBottom: 32 }}>
            <span style={{ fontSize: 14, color: '#8A949E' }}>홈</span>
            <span style={{ fontSize: 14, color: '#8A949E', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: 14, color: '#131416', fontWeight: 600 }}>구매/결제</span>
          </div>

          {/* 타이틀 + 스텝 인디케이터 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 700,
              fontSize: 40,
              lineHeight: '1.5em',
              color: '#131416',
              margin: 0,
            }}>
              구매/결제
            </h1>
            <StepIndicator />
          </div>

          {/* 메인 콘텐츠 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

              {/* 좌측: 결제 논문 목록 */}
              <div style={{ width: 756, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: '1.5em',
                  color: '#131416',
                  margin: 0,
                }}>
                  결제 논문
                </h2>

                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #CDD1D5',
                  borderRadius: 12,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  minHeight: 362,
                }}>
                  {displayItems.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
                      <p style={{ color: '#8A949E', fontSize: 17 }}>장바구니가 비어있습니다.</p>
                      <button
                        onClick={() => navigate('/cart')}
                        style={{ color: '#256EF4', fontSize: 15, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        장바구니로 돌아가기
                      </button>
                    </div>
                  ) : (
                    <>
                      {displayItems.map((item, idx) => (
                        <div key={item.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <p style={{
                                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                                  fontWeight: 700,
                                  fontSize: 19,
                                  lineHeight: '1.5em',
                                  color: '#1E2124',
                                  margin: 0,
                                  flex: 1,
                                }}>
                                  {item.title}
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>저자</span>
                                <span style={{ fontSize: 13, color: '#CDD1D5' }}>|</span>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>{item.unit_price.toLocaleString()}원</span>
                                <span style={{ fontSize: 13, color: '#CDD1D5', margin: '0 2px' }}>|</span>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>수량 {item.quantity}개</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>발행기관</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>저널명</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                                  <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>KCI등재</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <span style={{
                                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                                fontWeight: 700,
                                fontSize: 17,
                                lineHeight: '1.5em',
                                color: '#131416',
                                whiteSpace: 'nowrap',
                              }}>
                                {(item.unit_price * item.quantity).toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          {idx < displayItems.length - 1 && (
                            <div style={{ borderTop: '1px dashed #8A949E', marginTop: 24 }} />
                          )}
                        </div>
                      ))}

                      <div style={{ borderTop: '1px dashed #8A949E' }} />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '10px' }}>
                        <span style={{
                          fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                          fontWeight: 700,
                          fontSize: 19,
                          lineHeight: '1.5em',
                          color: '#131416',
                        }}>
                          총 결제금액
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                          fontWeight: 700,
                          fontSize: 19,
                          lineHeight: '1.5em',
                          color: '#131416',
                        }}>
                          {totalAmount.toLocaleString()}원
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 우측: 결제 수단 */}
              <div style={{ width: 460, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h2 style={{
                  fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: '1.5em',
                  color: '#131416',
                  margin: 0,
                }}>
                  결제 수단
                </h2>

                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #CDD1D5',
                  borderRadius: 12,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                }}>
                  <div style={{ display: 'flex', gap: 0 }}>
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
                          style={{
                            flex: 1,
                            height: 48,
                            padding: '0 16px',
                            border: '1px solid #58616A',
                            borderRadius: 6,
                            margin: '0 4px',
                            fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                            fontWeight: 400,
                            fontSize: 17,
                            lineHeight: '1.5em',
                            color: '#1E2124',
                            background: isActive ? '#F4F5F6' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === 'CARD' && (
                    <p style={{ fontSize: 15, color: '#8A949E', margin: 0, lineHeight: '1.5em' }}>
                      신용카드 결제를 이용하여 결제할 수 있습니다.
                    </p>
                  )}
                  {paymentMethod === 'VIRTUAL_ACCOUNT' && (
                    <p style={{ fontSize: 15, color: '#8A949E', margin: 0, lineHeight: '1.5em' }}>
                      가상계좌 결제를 이용하여 결제할 수 있습니다.
                    </p>
                  )}
                  {paymentMethod === 'TRANSFER' && (
                    <p style={{ fontSize: 15, color: '#8A949E', margin: 0, lineHeight: '1.5em' }}>
                      휴대폰 소액결제를 이용하여 결제할 수 있습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 하단: 약관 동의 + 결제 버튼 */}
            {displayItems.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1px solid #CDD1D5',
                borderRadius: 12,
                padding: 32,
                gap: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                  <button
                    onClick={() => setAgreed(!agreed)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: agreed ? '#256EF4' : '#FFFFFF',
                      border: agreed ? 'none' : '1.5px solid #CDD1D5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 2,
                    }}
                  >
                    {agreed && (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1.5 5L5.5 9L12.5 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span style={{
                    fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                    fontWeight: 700,
                    fontSize: 19,
                    lineHeight: '1.5em',
                    color: '#131416',
                  }}>
                    주문 상품정보 및 결제대행 서비스 이용약관에 모두 동의하십니까?
                  </span>
                  </label>
                  <span
                    onClick={() => setTermsModalOpen(true)}
                    style={{
                      fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                      fontWeight: 400,
                      fontSize: 17,
                      lineHeight: '1.5em',
                      color: '#131416',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}>
                    약관보기
                  </span>
                </div>

                {error && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}>
                    <p style={{ color: '#991B1B', fontSize: 15, margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!agreed) {
                      alert('상품정보 및 서비스 이용약관에 동의해주세요.');
                      return;
                    }
                    handlePayment();
                  }}
                  disabled={loading || totalAmount === 0}
                  style={{
                    width: 300,
                    height: 64,
                    borderRadius: 8,
                    background: loading || totalAmount === 0 || !agreed ? '#CDD1D5' : '#256EF4',
                    border: 'none',
                    cursor: loading || totalAmount === 0 || !agreed ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: '1.5em',
                    color: '#FFFFFF',
                  }}>
                    {loading ? '처리 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
                  </span>
                </button>
              </div>
            )}

            <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />

            {displayItems.length === 0 && error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '16px',
              }}>
                <p style={{ color: '#991B1B', margin: 0 }}>{error}</p>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#256EF4' }}></div>
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}
