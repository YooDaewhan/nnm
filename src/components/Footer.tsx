import React, { useState } from 'react';

type ModalType = '이용약관' | '개인정보처리방침' | '이용문의' | null;

const s = { fontFamily: 'Pretendard GOV, Pretendard, sans-serif' };

const MODAL_CONTENT: Record<Exclude<ModalType, null>, React.ReactNode> = {
  이용약관: (
    <div className="flex flex-col gap-4 text-sm text-[#464C53]" style={s}>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제1조 (목적)</strong>
        <p>이 약관은 학지사 뉴논문(이하 "회사")이 제공하는 온라인 학술자료 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제2조 (정의)</strong>
        <p>"서비스"란 회사가 제공하는 논문·학술자료 검색, 열람, 다운로드 등 일체의 온라인 서비스를 말합니다.<br />"이용자"란 이 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.<br />"콘텐츠"란 서비스 내에서 제공되는 논문, 학술지, 자료집 등 모든 디지털 저작물을 말합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제3조 (약관의 효력 및 변경)</strong>
        <p>이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 회사는 관련 법령에 위배되지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 적용일 7일 전에 공지합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제4조 (서비스 이용)</strong>
        <p>이용자는 서비스를 통해 제공되는 콘텐츠를 개인적·비상업적 목적으로만 이용할 수 있습니다. 콘텐츠의 무단 복제, 배포, 전송, 공중송신 등은 저작권법에 의해 금지됩니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제5조 (회원가입 및 탈퇴)</strong>
        <p>회원가입은 이용자가 약관에 동의한 후 회원정보를 입력하고 회사가 승낙함으로써 완료됩니다. 회원은 언제든지 서비스 내 탈퇴 기능을 통해 이용계약을 해지할 수 있습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제6조 (책임의 한계)</strong>
        <p>회사는 천재지변, 시스템 장애 등 불가피한 사유로 서비스 제공이 중단된 경우 책임을 지지 않습니다. 이용자가 제공한 정보의 부정확으로 발생한 문제는 이용자 본인의 책임입니다.</p>
      </section>
    </div>
  ),
  개인정보처리방침: (
    <div className="flex flex-col gap-4 text-sm text-[#464C53]" style={s}>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">1. 수집하는 개인정보 항목</strong>
        <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.<br />
        · 필수: 이름, 이메일 주소, 비밀번호, 소속 기관<br />
        · 선택: 연락처, 직책, 전공 분야<br />
        · 자동 수집: 접속 IP, 쿠키, 서비스 이용 기록, 기기 정보</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">2. 개인정보의 수집 및 이용 목적</strong>
        <p>· 회원 가입 및 본인 확인<br />
        · 서비스 제공 및 콘텐츠 결제 처리<br />
        · 고객 문의 응대 및 분쟁 처리<br />
        · 신규 서비스 안내 및 마케팅 (동의자에 한함)</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">3. 개인정보의 보유 및 이용 기간</strong>
        <p>회원 탈퇴 시 즉시 파기하는 것을 원칙으로 합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.<br />
        · 전자상거래 관련 기록: 5년<br />
        · 소비자 불만·분쟁 처리 기록: 3년<br />
        · 접속 로그: 3개월</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">4. 개인정보의 제3자 제공</strong>
        <p>회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 법령에 의한 수사기관의 요청이나 이용자 본인의 동의가 있는 경우에는 예외로 합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">5. 이용자의 권리</strong>
        <p>이용자는 언제든지 자신의 개인정보를 조회·수정·삭제할 수 있으며, 개인정보 처리에 대한 동의를 철회할 수 있습니다. 관련 요청은 고객센터(qna@hakjisa.co.kr)로 문의하시기 바랍니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">6. 개인정보 보호책임자</strong>
        <p>· 성명: 개인정보 보호팀<br />
        · 이메일: qna@hakjisa.co.kr<br />
        · 전화: 02-330-5170</p>
      </section>
    </div>
  ),
  이용문의: (
    <div className="flex flex-col gap-4 text-sm text-[#464C53]" style={s}>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">고객센터 안내</strong>
        <p>뉴논문 서비스 이용 중 불편한 점이나 궁금한 사항이 있으시면 아래 채널을 통해 문의해 주세요.</p>
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <strong className="text-[#1E2124]">전화 문의</strong>
          <p>02-330-5170<br />평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00, 공휴일 제외)</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <strong className="text-[#1E2124]">이메일 문의</strong>
          <p>qna@hakjisa.co.kr<br />접수 후 영업일 기준 1~2일 이내 답변 드립니다.</p>
        </div>
        <div className="flex flex-col gap-0.5">
          <strong className="text-[#1E2124]">카카오톡 채널</strong>
          <p>@학지사뉴논문<br />카카오톡 채널 친구 추가 후 채팅으로 문의하실 수 있습니다.</p>
        </div>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">자주 묻는 질문</strong>
        <ul className="flex flex-col gap-1 list-disc list-inside">
          <li>논문 다운로드 방법: 로그인 후 원하는 논문 상세 페이지에서 다운로드 버튼을 클릭하세요.</li>
          <li>결제 영수증 발급: 마이페이지 &gt; 결제 내역에서 영수증을 출력하실 수 있습니다.</li>
          <li>기관 구독 문의: 이메일 또는 전화로 담당자에게 직접 문의해 주세요.</li>
          <li>비밀번호 분실: 로그인 화면의 비밀번호 찾기 기능을 이용해 주세요.</li>
        </ul>
      </section>
    </div>
  ),
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
          className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-8 flex flex-col gap-4 max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <h2
            className="text-[#1E2124] text-lg"
            style={{ fontWeight: 700 }}
          >
            {modal}
          </h2>
          <div className="overflow-y-auto flex-1">
            {MODAL_CONTENT[modal]}
          </div>
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
      <div className="wrap flex flex-col items-center gap-4 py-8">
        <div className="w-full flex flex-col gap-6">

          {/* Row: company-info (left, fill) + external-link (right) */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">

            {/* company-info */}
            <div className="flex flex-col flex-1 gap-4 md:gap-2">
              {/* 대표전화 */}
              <div className="flex flex-row flex-wrap gap-1 items-center">
                <dl className="flex flex-row items-center gap-2 font-bold text-[17px]">
                  <dt>대표전화</dt>
                  <dd>02-330-5170</dd>
                </dl>
                <dl>
                  <dd>(평일 09시-18시, 공휴일 제외)</dd>
                </dl>
              </div>

              {/* 사업자 정보 */}
              <div className="flex flex-col gap-1 md:flex-row md:gap-4">
                <dl className="flex flex-row items-center gap-2">
                  <dt>통신판매업신고번호</dt>
                  <dd>2008-서울마포-0666</dd>
                </dl>
                <dl className="flex flex-row items-center gap-2">
                  <dt>사업자등록번호</dt>
                  <dd>105-87-03735</dd>
                </dl>
                <dl className="flex flex-row items-center gap-2">
                  <dt>이메일</dt>
                  <dd>qna@hakjisa.co.kr</dd>
                </dl>
              </div>
            </div>

            {/* external-link: social icons + our-network selectbox */}
            <div className="flex flex-row items-center gap-4 justify-end">
              {/* social icons */}
              <div className="flex flex-row items-center gap-2">
                {/* 네이버 블로그 */}
                <a href="https://blog.naver.com/hjs_newnonmun" target="_blank" rel="noopener noreferrer" aria-label="네이버 블로그" className="flex items-center justify-center w-8 h-8 hover:opacity-80">
                  <img src="/icons/naver_blog.svg" alt="네이버 블로그" style={{ width: 24, height: 24 }} />
                </a>  
                {/* 카카오톡 채널 */}
                {/* <a href="https://pf.kakao.com/_PLxgJj" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 채널" className="flex items-center justify-center w-8 h-8 hover:opacity-80">
                  <img src="/icons/kakaotalk_channel.svg" alt="카카오톡 채널" style={{ width: 24, height: 24 }} />
                </a> */}
              </div>

              {/* our-network selectbox */}
              <div className="flex flex-col gap-2.5 w-[200px]">
                <div className="relative w-[200px]">
                  <select
                    className="w-full h-9 px-4 bg-white border border-[#58616A] rounded-[6px] appearance-none cursor-pointer focus:outline-none"
                    style={{ fontSize: 15, color: '#1E2124' }}
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
            <div className="terms-link flex flex-row gap-4">
              <a onClick={() => setModal('이용약관')}>
                이용약관
              </a>
              <a onClick={() => setModal('개인정보처리방침')}>
                개인정보처리방침
              </a>
              <a onClick={() => setModal('이용문의')}>
                이용문의
              </a>
            </div>

            {/* copyright */}
            <div className="copyright flex items-center">
              <span
                style={{ fontSize: 13, color: '#464C53' }}
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
