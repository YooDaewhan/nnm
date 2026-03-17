import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../../lib/auth';
import { logout } from '../../api/auth';
import MypageLayout from '../../components/MyPageLayout';
import { getToken } from '../../lib/auth';
import { API_BASE_URL } from '../../api/client';

type QnaItem = {
  id: string;
  title: string;
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  answer?: string;
};

export default function MyPageQnaPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<QnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qContent, setQContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    fetchQna();
  }, [navigate]);

  const fetchQna = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/qna`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.items ?? data.data ?? []));
    } catch {
      setError('Q&A 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!qTitle.trim() || !qContent.trim()) { alert('제목과 내용을 입력해주세요.'); return; }
    setSubmitLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/qna`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ title: qTitle, content: qContent }),
      });
      if (res.ok) {
        alert('문의가 접수되었습니다.');
        setShowForm(false); setQTitle(''); setQContent('');
        fetchQna();
      } else {
        alert('문의 접수에 실패했습니다.');
      }
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const statusLabel: Record<string, string> = {
    pending: '답변 대기', answered: '답변 완료', closed: '종료',
  };

  return (
    <MypageLayout onLogout={handleLogout}>
      <div className="bg-white rounded-xl border border-[#D6E0EB] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-bold text-[#1E2124]">Q&amp;A</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-[14px] bg-[#256EF4] text-white rounded-lg hover:bg-[#1a5cd8] transition">
            {showForm ? '취소' : '문의하기'}
          </button>
        </div>

        {/* 문의 작성 폼 */}
        {showForm && (
          <div className="bg-[#F8FAFC] rounded-xl border border-[#D6E0EB] p-6 mb-6 flex flex-col gap-3">
            <input type="text" value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="제목"
              className="w-full px-4 py-3 bg-white border border-[#CDD1D5] rounded-lg text-[16px] outline-none focus:border-[#256EF4]" />
            <textarea value={qContent} onChange={e => setQContent(e.target.value)} placeholder="문의 내용을 입력해주세요." rows={5}
              className="w-full px-4 py-3 bg-white border border-[#CDD1D5] rounded-lg text-[15px] outline-none focus:border-[#256EF4] resize-none" />
            <button onClick={handleSubmit} disabled={submitLoading}
              className="self-end px-6 py-2.5 bg-[#039BE5] text-white rounded-lg text-[15px] disabled:opacity-50 hover:bg-[#0288D1] transition">
              {submitLoading ? '접수 중...' : '접수하기'}
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && <p className="text-center py-16 text-red-500">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-center py-16 text-[#9CA3AF]">문의 내역이 없습니다.</p>
        )}
        {!loading && items.length > 0 && (
          <ul className="divide-y divide-[#F3F4F6]">
            {items.map(item => (
              <li key={item.id}>
                <button
                  className="w-full text-left py-4 px-3 hover:bg-[#F8FAFC] rounded-lg transition"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-medium text-[#1E2124]">{item.title}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] px-2 py-0.5 rounded-full ${
                        item.status === 'answered' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {statusLabel[item.status] ?? item.status}
                      </span>
                      <span className="text-[13px] text-[#9CA3AF]">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </button>
                {expandedId === item.id && item.answer && (
                  <div className="mx-3 mb-3 px-4 py-3 bg-[#EFF4FF] rounded-lg text-[15px] text-[#374151]">
                    <span className="font-semibold text-[#256EF4] block mb-1">답변</span>
                    {item.answer}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MypageLayout>
  );
}
