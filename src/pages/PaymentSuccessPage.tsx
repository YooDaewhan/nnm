import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPayment as confirmPaymentApi } from '../api/payment';
import { removeFromCart } from '../api/cart';

// 스텝 인디케이터 (결제완료 단계)
function StepIndicator() {
  const steps = ['장바구니', '구매/결제', '결제완료'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = idx < 2;

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '2px 0' }}>
                {isCompleted ? (
                  <>
                    <div style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                      background: '#256EF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {!isLast && (
                      <div style={{ flex: 1, height: 1, background: '#CDD1D5' }} />
                    )}
                  </>
                ) : (
                  <div style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: '#256EF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: '#256EF4', border: '1.6px solid #FFFFFF',
                    }} />
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                fontWeight: 700, fontSize: 15, lineHeight: '1.5em',
                color: '#1E2124', paddingRight: 24,
              }}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="#F4F5F6"/>
      <path d="M16 7V21M16 21L11 16M16 21L21 16" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 25H23" stroke="#33363D" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function PaymentSuccessContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirmedRef = useRef(false);

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
        console.error('결제 승인 오류:', err);
        setError(err instanceof Error ? err.message : '결제 승인에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handleConfirmPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid transparent', borderBottomColor: '#256EF4',
            animation: 'spin 1s linear infinite', margin: '0 auto',
          }} />
          <p style={{ marginTop: 16, color: '#464C53', fontSize: 17 }}>결제 정보를 확인하는 중...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #CDD1D5', borderRadius: 12,
          padding: 48, maxWidth: 480, width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h1 style={{
            fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
            fontWeight: 700, fontSize: 24, color: '#131416', marginBottom: 8,
          }}>오류 발생</h1>
          <p style={{ fontSize: 17, color: '#464C53' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: 24, padding: '12px 32px', borderRadius: 8,
              background: '#256EF4', border: 'none', color: '#FFFFFF',
              fontWeight: 700, fontSize: 17, cursor: 'pointer',
            }}
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <main style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <div style={{ width: 1280, padding: '0 16px' }}>

          {/* 브레드크럼 */}
          <div style={{ paddingBottom: 32, display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="#1E2124" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={{ fontSize: 15, color: '#1E2124', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => navigate('/')}>홈</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#1E2124" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 15, color: '#1E2124', textDecoration: 'underline' }}>결제완료</span>
          </div>

          {/* 타이틀 + 스텝 인디케이터 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 700, fontSize: 40, lineHeight: '1.5em',
              color: '#131416', margin: 0,
            }}>
              결제완료
            </h1>
            <StepIndicator />
          </div>

          {/* 감사 안내 메시지 박스 */}
          <div style={{
            background: '#EEF2F7', borderRadius: 12,
            padding: 24, marginBottom: 16, width: 1248,
          }}>
            <p style={{
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 400, fontSize: 19, lineHeight: '1.5em',
              color: '#1E2124', margin: 0,
            }}>
              이용해 주셔서 감사합니다.<br />
              결제하신 논문은 마이페이지 &gt; 구매 내역에서 5일간 다운로드 받으실 수 있습니다.
            </p>
          </div>

          {/* 논문 리스트 카드 */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #CDD1D5',
            borderRadius: 12, padding: 32,
            width: 1248, boxSizing: 'border-box' as const,
            display: 'flex', flexDirection: 'column' as const, gap: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{
                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                fontWeight: 400, fontSize: 19, lineHeight: '1.5em',
                color: '#1E2124', margin: 0,
              }}>
                다운로드는 결제 후 5일 동안만 가능하오니 이용에 참고 부탁드립니다.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => navigate('/mypage/orders/')}
                  style={{
                    height: 48, padding: '0 16px',
                    border: '1px solid #58616A', borderRadius: 6,
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                    fontWeight: 400, fontSize: 17, color: '#1E2124',
                    whiteSpace: 'nowrap',
                  }}
                >
                  구매내역으로 이동
                </button>
                <button
                  onClick={() => navigate('/mypage/orders/')}
                  style={{
                    height: 48, padding: '0 16px',
                    border: '1px solid #58616A', borderRadius: 6,
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                    fontWeight: 400, fontSize: 17, color: '#1E2124',
                    whiteSpace: 'nowrap',
                  }}
                >
                  논문 전체 다운로드
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #8A949E' }} />

            {articleItems.map((item: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{
                      fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                      fontWeight: 700, fontSize: 19, lineHeight: '1.5em',
                      color: '#1E2124', margin: 0,
                    }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 15, color: '#464C53', lineHeight: '1.5em' }}>
                        {item.authors || '저자'}
                      </span>
                      {item.publishDate && (
                        <>
                          <span style={{ fontSize: 13, color: '#CDD1D5', margin: '0 2px' }}>|</span>
                          <span style={{ fontSize: 15, color: '#464C53' }}>{item.publishDate}</span>
                        </>
                      )}
                      {item.grade && (
                        <>
                          <span style={{ fontSize: 13, color: '#CDD1D5', margin: '0 2px' }}>|</span>
                          <span style={{ fontSize: 15, color: '#464C53' }}>{item.grade}</span>
                        </>
                      )}
                    </div>
                    {(item.publisher || item.journalName) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {item.publisher && (
                          <span style={{ fontSize: 15, color: '#464C53' }}>{item.publisher}</span>
                        )}
                        {item.journalName && (
                          <>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                              <path d="M6 12L10 8L6 4" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span style={{ fontSize: 15, color: '#464C53' }}>{item.journalName}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                    title="논문 다운로드"
                  >
                    <DownloadIcon />
                  </button>
                </div>

                {idx < articleItems.length - 1 && (
                  <div style={{ borderTop: '1px dashed #8A949E', marginTop: 24 }} />
                )}
              </div>
            ))}
          </div>

          {/* 가상계좌 정보 */}
          {paymentData?.virtualAccount && (
            <div style={{
              marginTop: 16, background: '#FFFBEB',
              border: '1px solid #FDE68A', borderRadius: 12, padding: 32,
              width: 1248, boxSizing: 'border-box' as const,
            }}>
              <h3 style={{
                fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
                fontWeight: 700, fontSize: 19, color: '#92400E', marginBottom: 16,
              }}>
                🏦 가상계좌 정보
              </h3>
              <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 24 }}>
                {[
                  { label: '은행', value: paymentData.virtualAccount.bankCode === '06' ? '국민은행' : paymentData.virtualAccount.bankCode },
                  { label: '계좌번호', value: paymentData.virtualAccount.accountNumber },
                  { label: '입금 기한', value: new Date(paymentData.virtualAccount.dueDate).toLocaleString('ko-KR') },
                  { label: '예금주', value: paymentData.virtualAccount.customerName },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: 15, color: '#464C53' }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#131416' }}>{value}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 15, color: '#92400E' }}>
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
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid transparent', borderBottomColor: '#256EF4',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
