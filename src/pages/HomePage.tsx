import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'저널' | '논문' | '저자'>('저널');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&scope=${activeTab}`);
  };

  return (
    <div className="bg-white flex flex-col flex-1">
      <main className="flex items-center justify-center w-full">
        <div className="w-full max-w-[1280px] px-4">
          <div className="flex flex-row items-center gap-20" style={{ height: 780 }}>
            {/* Left */}
            <div className="flex flex-col justify-center gap-12 shrink-0" style={{ height: 696 }}>
              <div className="flex flex-col gap-4">
                <h1 style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 800, fontSize: 64, lineHeight: '1.25em', color: '#1E2124', whiteSpace: 'pre-line' }}>
                  {`논문 검색 \n더 쉬워졌습니다`}
                </h1>
                <p style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 32, lineHeight: '1.5em', color: '#1E2124' }}>
                  복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-2">
                  {(['저널', '논문', '저자'] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className="flex flex-row items-center justify-center gap-1 px-4 h-10 rounded-full"
                        style={{ background: isActive ? '#58616A' : '#F4F5F6', border: 'none', cursor: 'pointer' }}
                      >
                        <span style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: '1.5em', color: isActive ? '#FFFFFF' : '#1E2124' }}>
                          {tab}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-4" style={{ width: 600 }}>
                  <form onSubmit={handleSearch}>
                    <div className="flex flex-row items-center gap-4"
                      style={{ width: 600, height: 80, background: '#1E2124', border: '1px solid #1E2124', borderRadius: 12, paddingLeft: 32, paddingRight: 32 }}
                    >
                      <div className="flex flex-row items-center gap-2 flex-1">
                        <input
                          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                          placeholder="검색어를 입력해주세요"
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 24, lineHeight: '1.5em', color: '#FFFFFF' }}
                          className="placeholder-white/60"
                        />
                        <button type="submit" className="flex items-center justify-center shrink-0"
                          style={{ width: 40, height: 40, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="17" cy="17" r="10" stroke="white" strokeWidth="2.5" />
                            <line x1="24.07" y1="24.07" x2="33" y2="33" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="shrink-0 overflow-hidden" style={{ width: 660, height: 550 }}>
              <img src="/images/hero-main.png" alt="뉴논문 메인 이미지"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
