import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from '../lib/auth';
import { getCart, removeFromCart, type CartItem } from '../api/cart';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const { data: cartItems = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated(),
  });

  const error = fetchError instanceof Error ? fetchError.message : fetchError ? '장바구니 조회에 실패했습니다.' : null;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const cartItemIds = cartItems.map(item => item.id).join(',');
  useEffect(() => {
    setSelectedItems(cartItems.map((item: CartItem) => item.id));
  }, [cartItemIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: (_, id) => {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err) => alert(err instanceof Error ? err.message : '삭제에 실패했습니다.'),
  });

  const totalAmount = cartItems
    .filter((item: CartItem) => selectedItems.includes(item.id))
    .reduce((sum: number, item: CartItem) => sum + (item.subtotal ?? item.unit_price ?? 0), 0);

  const handleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item: CartItem) => item.id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F6] flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <div className="flex justify-center py-10">
        <div className="w-full max-w-[1280px] px-4">
      {/* 장바구니 영역 */}
      <div className="space-y-8">
        {/* 타이틀 + 스텝 인디케이터 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-[40px] font-bold leading-[1.5] tracking-[0.025em] text-[#131416]">
              장바구니
            </h1>
            {/* 스텝 인디케이터 */}
            <div className="hidden md:flex gap-0">
              <div className="w-[120px]">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#256EF4]">
                    <div className="w-[14px] h-[14px] border-[1.6px] border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 h-px bg-[#CDD1D5]"></div>
                </div>
                <div className="pt-2 pr-6">
                  <p className="text-[15px] font-bold text-[#1E2124]">장바구니</p>
                </div>
              </div>
              <div className="w-[120px]">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#E6E8EA] border border-[#CDD1D5]"></div>
                  <div className="flex-1 h-px bg-[#CDD1D5]"></div>
                </div>
                <div className="pt-2 pr-6">
                  <p className="text-[15px] font-bold text-[#1E2124]">구매/결제</p>
                </div>
              </div>
              <div className="w-[120px]">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#E6E8EA] border border-[#CDD1D5]"></div>
                </div>
                <div className="pt-2 pr-6">
                  <p className="text-[15px] font-bold text-[#1E2124]">결제완료</p>
                </div>
              </div>
            </div>
          </div>

          {/* 설명 박스 */}
          <div className="px-6 py-6 bg-[#EEF2F7] rounded-xl">
            <p className="text-[19px] leading-[1.5] text-[#1E2124]">
              장바구니에 담긴 논문은 30일간 보관됩니다
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* 상품 목록 */}
        <div className="bg-white border border-[#CDD1D5] rounded-xl p-8 space-y-6">
          {cartItems.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p className="text-[19px] text-[#464C53]">장바구니가 비어있습니다.</p>
              <button
                onClick={() => navigate('/')}
                className="text-[#256EF4] hover:text-[#1e5bd4] font-medium"
              >
                상품 둘러보기
              </button>
            </div>
          ) : (
            <>
              {/* 전체 선택 + 선택삭제 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === cartItems.length}
                    onChange={handleSelectAll}
                    className="w-6 h-6 border-2 border-[#256EF4] rounded checked:bg-[#256EF4]"
                  />
                  <label className="text-[19px] leading-[1.5] text-[#131416]">
                    전체선택 {selectedItems.length}/{cartItems.length}
                  </label>
                </div>
                <button
                  onClick={async () => {
                    await Promise.all(selectedItems.map((id) => removeMutation.mutateAsync(id)));
                  }}
                  disabled={removeMutation.isPending}
                  className="h-10 px-3 text-[15px] leading-[1.5] text-[#1E2124] border border-[#58616A] rounded-md hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  선택삭제
                </button>
              </div>

              <div className="border-t border-dashed border-[#8A949E]"></div>

              {/* 상품 아이템 리스트 */}
              <div className="space-y-6">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex gap-6">
                    <div className="flex items-center justify-center pt-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="w-6 h-6 border-2 border-[#256EF4] rounded checked:bg-[#256EF4]"
                      />
                    </div>
                    <div className="flex-1 flex items-center gap-20">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[19px] font-bold leading-[1.5] text-[#1E2124]">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">저자1</span>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">저자2</span>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">저자3</span>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">외 1명</span>
                        </div>
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">발행년월</span>
                          <svg className="w-4 h-4 text-[#CDD1D5]" viewBox="0 0 16 16" fill="none">
                            <line x1="7.47" y1="1.47" x2="7.47" y2="14.53" stroke="currentColor" strokeWidth="1.07"/>
                          </svg>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">KCI등재</span>
                        </div>
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">발행기관</span>
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M5.63 3.13L11.03 8.53L5.63 12.87" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">저널명</span>
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M5.63 3.13L11.03 8.53L5.63 12.87" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">권(호)</span>
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M5.63 3.13L11.03 8.53L5.63 12.87" stroke="#CDD1D5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="h-6 px-0.5 text-[15px] leading-[1.5] text-[#464C53]">페이지 수록 정보</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <p className="text-[17px] font-bold leading-[1.5] text-center text-[#131416]">
                          {(item.unit_price ?? 0).toLocaleString()}원
                        </p>
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending && removeMutation.variables === item.id}
                        className="flex items-center justify-center disabled:opacity-50"
                      >
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                          <circle cx="16" cy="16" r="13.33" stroke="#33363D" strokeWidth="2"/>
                          <path d="M11.33 11.33L20.67 20.67M20.67 11.33L11.33 20.67" stroke="#33363D" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-[#8A949E]"></div>

              {/* 합계 + 결제 버튼 */}
              <div className="flex items-center justify-end gap-6">
                <div className="py-2.5">
                  <p className="text-[24px] font-bold leading-[1.5] text-right text-[#131416]">
                    총 {selectedItems.length}건 결제금액&nbsp;&nbsp;{totalAmount.toLocaleString()}원
                  </p>
                </div>
                <button
                  onClick={() => navigate('/pay')}
                  disabled={selectedItems.length === 0}
                  className="h-16 px-6 bg-[#256EF4] hover:bg-[#1e5bd4] text-white text-[19px] font-medium leading-[1.5] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  결제하기
                </button>
              </div>
            </>
          )}
        </div>

        {/* 이용 기간 및 환불 안내 */}
        <div className="bg-[#EEF2F7] rounded-xl px-6 py-6 space-y-2">
          <p className="text-[19px] font-bold leading-[1.5] text-[#D63D4A]">
            이용 기간 및 환불 안내
          </p>
          <p className="text-[17px] leading-[1.5] text-[#1E2124]">
            다운로드 기간: 구매하신 논문은 [구매내역]에서 결제일로부터 5일간 다운로드하실 수 있습니다.
          </p>
          <p className="text-[17px] leading-[1.5] text-[#1E2124]">
            취소 및 환불: 디지털 콘텐츠 특성상 결제 후에는 원칙적으로 취소 및 환불이 불가합니다. 단, 아래의 경우 고객센터로 문의해 주시면 즉시 확인해 드리겠습니다.
          </p>
          <p className="text-[17px] leading-[1.5] text-[#1E2124] pl-4">
            구매한 정보와 다른 논문이 다운로드된 경우<br />
            파일에 손상이 있거나 내용을 확인하기 어려운 경우<br />
            시스템 문제로 72시간 이내에 정상적인 다운로드가 되지 않은 경우
          </p>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
