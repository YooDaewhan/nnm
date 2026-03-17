import { Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PaymentFailContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 실패 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-gray-600">결제 처리 중 문제가 발생했습니다.</p>
        </div>

        {/* 오류 정보 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-900 mb-3">오류 정보</h2>
          <div className="space-y-2">
            {errorCode && (
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">오류 코드:</span>
                <span className="text-red-800">{errorCode}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex gap-2">
                <span className="text-red-600 font-semibold">오류 메시지:</span>
                <span className="text-red-800">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">다음 조치 사항:</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>결제 정보를 다시 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>카드 한도나 잔액을 확인해주세요</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>문제가 지속되면 고객센터로 문의해주세요</span>
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/pay')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition"
          >
            다시 시도하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-center font-semibold py-3 px-6 rounded-lg transition"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
