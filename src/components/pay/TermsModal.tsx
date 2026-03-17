interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520,
          background: '#EEF2F7',
          borderRadius: 12,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* 닫기 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#1E2124" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 주문 상품정보에 대한 동의 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 19, lineHeight: '1.5em', color: '#1E2124' }}>
            주문 상품정보에 대한 동의
          </span>
          <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 17, lineHeight: '1.5em', color: '#1E2124' }}>
            주문하실 상품, 가격, 배송정보, 할인내역등을 최종 확인하였으며, 구매에 동의합니다. (전상거래법 제8조 제2항)
          </span>
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #CDD1D5' }} />

        {/* 결제대행 서비스 이용약관 동의 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 19, lineHeight: '1.5em', color: '#1E2124' }}>
            결제대행 서비스 이용약관 동의
          </span>

          {/* 전자금융거래 기본약관 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 17, lineHeight: '1.5em', color: '#1E2124' }}>
              전자금융거래 기본약관
            </span>
            <button style={{
              height: 32,
              padding: '0 10px',
              border: '1px solid #58616A',
              borderRadius: 4,
              background: 'transparent',
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '1.5em',
              color: '#1E2124',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              약관보기
            </button>
          </div>

          {/* 개인정보 수집 및 이용 동의 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 180 }}>
            <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 17, lineHeight: '1.5em', color: '#1E2124' }}>
              개인정보 수집 및 이용 동의
            </span>
            <button style={{
              height: 32,
              padding: '0 10px',
              border: '1px solid #58616A',
              borderRadius: 4,
              background: 'transparent',
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '1.5em',
              color: '#1E2124',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              약관보기
            </button>
          </div>

          {/* 개인정보 제공 및 위탁 동의 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 180 }}>
            <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 17, lineHeight: '1.5em', color: '#1E2124' }}>
              개인정보 제공 및 위탁 동의
            </span>
            <button style={{
              height: 32,
              padding: '0 10px',
              border: '1px solid #58616A',
              borderRadius: 4,
              background: 'transparent',
              fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
              fontWeight: 400,
              fontSize: 15,
              lineHeight: '1.5em',
              color: '#1E2124',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              약관보기
            </button>
          </div>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 8,
            background: '#256EF4',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Pretendard GOV, Pretendard, sans-serif',
            fontWeight: 700,
            fontSize: 17,
            color: '#FFFFFF',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
