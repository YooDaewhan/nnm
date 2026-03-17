import { PaymentDetailResponse } from '@/api/payment';

interface OrderDetailModalProps {
  modalLoading: boolean;
  modalPayment: PaymentDetailResponse['payment'] | null;
  modalError: string | null;
  showCancelModal: boolean;
  cancelReason: string;
  cancelling: boolean;
  onClose: () => void;
  onSetShowCancelModal: (show: boolean) => void;
  onSetCancelReason: (reason: string) => void;
  onCancelPayment: () => void;
}

export default function OrderDetailModal({
  modalLoading,
  modalPayment,
  modalError,
  showCancelModal,
  cancelReason,
  cancelling,
  onClose,
  onSetShowCancelModal,
  onSetCancelReason,
  onCancelPayment,
}: OrderDetailModalProps) {
  if (!modalLoading && !modalPayment && !modalError) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
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
          <button onClick={onClose} className="text-[#464C53] hover:text-[#1E2124] shrink-0">
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

            {/* 결제 취소 */}
            {(modalPayment.status === 'DONE' || modalPayment.status === 'paid') && !showCancelModal && (
              <button
                onClick={() => onSetShowCancelModal(true)}
                className="w-full h-12 border border-[#D32F2F] text-[#D32F2F] rounded-lg text-[17px] hover:bg-[#FEE9E7] transition-colors"
              >
                결제 취소
              </button>
            )}

            {showCancelModal && (
              <div className="flex flex-col gap-3">
                <p className="text-[15px] text-[#464C53]">정말로 결제를 취소하시겠습니까? 취소된 결제는 복구할 수 없습니다.</p>
                <textarea
                  value={cancelReason}
                  onChange={e => onSetCancelReason(e.target.value)}
                  placeholder="취소 사유를 입력해주세요"
                  rows={3}
                  className="w-full px-4 py-3 border border-[#CDD1D5] rounded-lg text-[15px] text-[#1E2124] placeholder-[#8A949E] focus:outline-none focus:border-[#256EF4] resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { onSetShowCancelModal(false); onSetCancelReason(''); }}
                    disabled={cancelling}
                    className="flex-1 h-12 border border-[#CDD1D5] rounded-lg text-[17px] text-[#464C53] hover:bg-[#F4F5F6] disabled:opacity-40"
                  >
                    닫기
                  </button>
                  <button
                    onClick={onCancelPayment}
                    disabled={cancelling}
                    className="flex-1 h-12 bg-[#D32F2F] text-white rounded-lg text-[17px] hover:bg-[#B71C1C] disabled:opacity-40"
                  >
                    {cancelling ? '취소 중...' : '결제 취소'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
