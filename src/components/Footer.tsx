import React, { useState } from 'react';

type ModalType = '이용약관' | '개인정보처리방침' | '이용문의' | null;

const MODAL_CONTENT: Record<Exclude<ModalType, null>, string> = {
  이용약관: '이용약관 서비스는 현재 준비중입니다.',
  개인정보처리방침: '개인정보처리방침 서비스는 현재 준비중입니다.',
  이용문의: '이용문의 서비스는 현재 준비중입니다.',
};

export default function Footer() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <>
      {modal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={() => setModal(null)}
      >
        <div
          className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-8 flex flex-col gap-4"
          onClick={e => e.stopPropagation()}
        >
          <h2
            className="text-[#1E2124] text-lg"
            style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700 }}
          >
            {modal}
          </h2>
          <p
            className="text-[#464C53] text-sm"
            style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400 }}
          >
            {MODAL_CONTENT[modal]}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setModal(null)}
              className="px-5 py-2 rounded-lg bg-[#1E2124] text-white text-sm hover:bg-[#464C53] transition-colors"
              style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif' }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )}

    <footer className="bg-[#F4F5F6] w-full flex flex-col items-center">
      {/* Top divider */}
      <div className="w-full border-t border-[#CDD1D5]" />

      {/* Surface */}
      <div className="w-full flex flex-col items-center gap-4 py-8">
        <div className="flex flex-col gap-6 w-full max-w-[1248px] px-4 md:px-0">

          {/* Row: company-info (left, fill) + external-link (right) */}
          <div className="flex flex-col md:flex-row md:justify-end md:items-end gap-4 md:gap-6 w-full">

            {/* company-info */}
            <div className="flex flex-col gap-2 flex-1">
              {/* 대표전화 */}
              <div className="flex flex-row items-center gap-2">
                <span
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 17, lineHeight: '1.5em' }}
                  className="text-[#1E2124]"
                >
                  대표전화
                </span>
                <span
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 700, fontSize: 17, lineHeight: '1.5em' }}
                  className="text-[#1E2124]"
                >
                  02-330-5170
                </span>
                <span
                  style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                  className="text-[#1E2124]"
                >
                  (평일 09시-18시, 공휴일 제외, 유료)
                </span>
              </div>

              {/* 사업자 정보 */}
              <div className="flex flex-row gap-4 flex-wrap">
                <div className="flex flex-row items-center gap-2">
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    통신판매업신고번호
                  </span>
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    2008-서울마포-0666
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    사업자등록번호
                  </span>
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    105-87-03735
                  </span>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    이메일
                  </span>
                  <span
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em' }}
                    className="text-[#1E2124]"
                  >
                    qna@hakjisa.co.kr
                  </span>
                </div>
              </div>
            </div>

            {/* external-link: social icons + our-network selectbox */}
            <div className="flex flex-row items-center gap-4">
              {/* social icons */}
              <div className="flex flex-row items-center gap-2">
                {/* 네이버 블로그 */}
                <a href="https://blog.naver.com/hjs_newnonmun" target="_blank" rel="noopener noreferrer" aria-label="네이버 블로그" className="flex items-center justify-center w-8 h-8 hover:opacity-80">
                  <img src="/icons/naver_blog.svg" alt="네이버 블로그" style={{ width: 24, height: 24 }} />
                </a>
                {/* 카카오톡 채널 */}
                <a href="https://pf.kakao.com/_PLxgJj" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 채널" className="flex items-center justify-center w-8 h-8 hover:opacity-80">
                  <img src="/icons/kakaotalk_channel.svg" alt="카카오톡 채널" style={{ width: 24, height: 24 }} />
                </a>
              </div>

              {/* our-network selectbox */}
              <div className="flex flex-col gap-2.5 w-[200px]">
                <div className="relative w-[200px]">
                  <select
                    className="w-full h-9 px-4 bg-white border border-[#58616A] rounded-[6px] appearance-none cursor-pointer focus:outline-none"
                    style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em', color: '#1E2124' }}
                    value=""
                    onChange={e => { if (e.target.value) { window.open(e.target.value, '_blank'); e.target.value = ''; } }}
                  >
                    <option value="" disabled>HCG 콘텐츠그룹</option>
                    <option value="https://www.hakjisa.co.kr/main.html">HCG 학지사</option>
                    <option value="https://sims.newnonmun.com/">HCG sims</option>
                  </select>
                  {/* arrow-drop-up icon */}
                  <svg
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2.667 6.182L8 11.515l5.333-5.333" stroke="#1E2124" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Middle divider */}
          <div className="w-full border-t border-[#CDD1D5]" />

          {/* footer-copyright row */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 w-full">
            {/* terms-link */}
            <div className="flex flex-row gap-4">
              <button
                onClick={() => setModal('이용약관')}
                className="h-6 px-0.5 hover:underline"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em', color: '#1E2124' }}
              >
                이용약관
              </button>
              <button
                onClick={() => setModal('개인정보처리방침')}
                className="h-6 px-0.5 hover:underline"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em', color: '#1E2124' }}
              >
                개인정보처리방침
              </button>
              <button
                onClick={() => setModal('이용문의')}
                className="h-6 px-0.5 hover:underline"
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 15, lineHeight: '1.5em', color: '#1E2124' }}
              >
                이용문의
              </button>
            </div>

            {/* copyright */}
            <div className="flex items-center h-6">
              <span
                style={{ fontFamily: 'Pretendard GOV, Pretendard, sans-serif', fontWeight: 400, fontSize: 13, lineHeight: '1.5em', color: '#464C53' }}
              >
                © HAKJISA, INC. All rights reserved.
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
    </>
  );
}
