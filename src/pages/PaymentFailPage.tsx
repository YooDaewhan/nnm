import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-[#FAFAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 실패 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-[#131416] mb-2">결제 실패</h1>
          <p className="text-[#464C53]">결제 처리 중 문제가 발생했습니다.</p>
        </div>

        {/* 오류 정보 */}
        <div className="bg-white border border-[#CDD1D5] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#AB2B36] mb-3">오류 정보</h2>
          <div className="space-y-2">
            {errorCode && (
              <div className="flex gap-2">
                <span className="text-[#AB2B36] font-semibold">오류 코드:</span>
                <span className="text-[#131416]">{errorCode}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex gap-2">
                <span className="text-[#AB2B36] font-semibold">오류 메시지:</span>
                <span className="text-[#131416]">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-white border border-[#CDD1D5] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[#131416] mb-3">다음 조치 사항:</h3>
          <ul className="space-y-2 text-[#464C53]">
            <li className="flex items-start">
              <span className="text-[#256EF4] mr-2">•</span>
              <span>결제 정보를 다시 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#256EF4] mr-2">•</span>
              <span>카드 한도나 잔액을 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#256EF4] mr-2">•</span>
              <span>문제가 지속되면 고객센터로 문의해주세요</span>
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/pay')}
            className="flex-1 bg-[#256EF4] hover:bg-[#1E5ADB] text-white text-center font-semibold py-3 px-6 rounded-md transition-colors"
          >
            다시 시도하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white border border-[#CDD1D5] hover:bg-[#F0F2F5] text-[#1E2124] text-center font-semibold py-3 px-6 rounded-md transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
