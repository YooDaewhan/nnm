import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';

const FAQ_ITEMS = [
  { id: 'faq1', question: '[서비스 이용] 구매를 위한 결제창이 뜨지 않을때는 어떻게 하나요?', answer: '' },
  { id: 'faq2', question: '[서비스 이용] 기관회원은 어떻게 가입하고 이용금액은 얼마인가요?', answer: '' },
  { id: 'faq3', question: '[서비스 이용] 원문열람은 어떻게 하나요?', answer: '' },
  { id: 'faq4', question: '[서비스 이용] 원문에 대한 결제를 취소/환불 받을 수 있나요?', answer: '' },
  { id: 'faq5', question: '[서비스 이용] 구매는 어떻게 하나요?', answer: '' },
  { id: 'faq6', question: '[서비스 이용] 아이디 또는 비밀번호는 어떻게 찾을 수 있나요?', answer: '' },
  { id: 'faq7', question: '[서비스 이용] 기관회원, 개인회원 로그인은 어떻게 하나요?', answer: '' },
  { id: 'faq8', question: '[서비스 이용] 개인회원에 가입하면 어떤 혜택이 있나요?', answer: '' },
  { id: 'faq9', question: '[서비스 이용] 기관회원, 개인회원은 무엇인가요?', answer: '' },
  { id: 'faq10', question: '[서비스 이용] 자료 검색방법은 어떤게 있나요?', answer: '' },
];

export default function MyPageQnaPage() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="bg-white rounded-xl border border-[#D6E0EB] p-4 sm:p-8">
        <h2 className="text-lg sm:text-[22px] font-bold text-[#1E2124] mb-6">자주 묻는 질문</h2>
        <ul className="divide-y divide-[#F3F4F6]">
          {FAQ_ITEMS.map(item => (
            <li key={item.id}>
              <button
                className="w-full text-left py-4 px-3 hover:bg-[#F8FAFC] rounded-lg transition flex items-center justify-between gap-2"
                onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
              >
                <span className="text-[15px] text-[#1E2124]">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-[#8A949E] shrink-0 transition-transform ${expandedFaq === item.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === item.id && (
                <div className="mx-3 mb-3 px-4 py-3 bg-[#F8FAFC] rounded-lg text-[15px] text-[#374151]">
                  {item.answer || '내용 준비 중입니다.'}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </MypageLayout>
  );
}
