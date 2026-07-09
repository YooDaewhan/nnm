import React, { useState } from 'react';

type ModalType = '이용약관' | '개인정보처리방침' | '이용문의' | null;

const s = { fontFamily: 'Pretendard GOV, Pretendard, sans-serif' };

const MODAL_CONTENT: Record<Exclude<ModalType, null>, React.ReactNode> = {
  이용약관: (
    <div className="flex flex-col gap-4 text-sm text-[#464C53]" style={s}>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제1조 (목적)</strong>
        <p>이 약관은 전기통신사업법 및 동법 시행령에 의하여 학지사가 제공하는 학술정보 서비스(이하 "서비스"라 한다)의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제2조 (회원)</strong>
        <p>회원은 본인 회원만을 원칙으로 합니다. 본인 회원이란 이 규약을 승인하고 당사의 회원신청양식에 본인의 신상명세를 기입하여 ID(고유번호)와 Password(비밀번호)를 발급 받으신 분을 말합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제3조 (고유번호와 비밀번호의 이용)</strong>
        <p>회원이 고유번호(ID)와 비밀번호를 이용하여 자료를 신청하고자 할 때에는 해당 자료를 선택 후 주문하며, 주문시의 비밀번호 입력과 주문신청 확인은 본인의 청약의사와 동일한 것으로 간주됩니다. 비밀번호를 변경하실 회원은 회원가입/회원변경란에서 직접 본인이 변경하여야 하고 부득이한 사정으로 회원이 당사에 요청하는 경우에 있어서는 당사에서 정보변경을 대신 합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제4조 (회원의 의무-고유번호와 비밀번호의 관리)</strong>
        <p>고유번호와 비밀번호는 회원본인이 직접 사용하여야 하며 본인이 아닌 타인이 이용하게 하여서는 안됩니다. 타인이 사용하게 되어서 일어날 수 있는 금전적 손실 등 각종 손해에 대한 책임은 본인에게 귀속됩니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">제5조 (개인정보의 변경사항 통지)</strong>
        <p>회원은 주소, E-Mail 주소, 전화번호 등의 변경이 있을 때에는 회사 홈페이지의 회원가입 / 회원변경란에 본인이 직접 수정하여야 합니다. 위의 통지를 태만히 함으로써 발생한 손해는 회원이 부담하여야 합니다.</p>
      </section>
    </div>
  ),
  개인정보처리방침: (
    <div className="flex flex-col gap-4 text-sm text-[#464C53]" style={s}>
      <section className="flex flex-col gap-1">
        <p>(주)학지사는 이용자들의 개인정보보호를 매우 중요시하며, 이용자가 회사의 서비스를 이용함과 동시에 온라인상에서 회사에 제공한 개인정보가 보호 받을 수 있도록 최선을 다하고 있습니다. 이에 (주)학지사는 통신비밀보호법, 전기통신사업법, 정보통신망 이용촉진 및 정보보호 등에관한 법률 등 정보통신서비스제공자가 준수하여야 할 관련 법규상의 개인정보보호 규정 및정보통신부가 제정한 개인정보보호지침을 준수하고 있습니다.</p>
        <p>(주)학지사는 개인정보 취급방침을 통하여 이용자들이 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려 드립니다.</p>
        <p>(주)학지사는 개인정보 취급방침을 홈페이지 첫 화면에 공개함으로써 이용자들이 언제나 용이하게 보실수 있도록 조치하고 있습니다.</p>
        <p>회사의 개인정보 취급방침은 정부의 법률 및 지침 변경이나 회사의 내부 방침 변경 등으로 인하여 수시로 변경될 수 있고, 이에 따른 개인정보 취급방침의 지속적인 개선을 위하여 필요한 절차를 정하고 있습니다. 그리고 개인정보 취급방침을 개정하는 경우나 개인정보 취급방침 변경될 경우 사이트의 첫페이지의 개인정보취급방침을 통해 고지하고 있습니다. 이용자들께서는 사이트 방문 시 수시로 확인하시기 바랍니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <p>(주)학지사의 개인정보 취급방침은 다음과 같은 내용을 담고 있습니다.</p>
        <ul className="flex flex-col gap-1 list-decimal list-inside">
          <li>개인정보 수집에 대한 동의</li>
          <li>개인정보의 수집목적 및 이용목적</li>
          <li>수집하는 개인정보 항목 및 수집방법</li>
          <li>수집하는 개인정보의 보유 및 이용기간</li>
          <li>수집한 개인정보의 공유 및 제공</li>
          <li>이용자 자신의 개인정보 관리(열람,정정,삭제 등)에 관한 사항</li>
          <li>쿠키(cookie)의 운영에 관한 사항</li>
          <li>비회원 고객의 개인정보 관리</li>
          <li>개인정보의 위탁처리</li>
          <li>개인정보관련 의견수렴 및 불만처리에 관한 사항</li>
          <li>개인정보 관리책임자 및 담당자의 소속-성명 및 연락처</li>
          <li>고지의 의무</li>
        </ul>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">1. 개인정보 수집에 대한 동의</strong>
        <p>(주)학지사는 이용자들이 회사의 개인정보 수집 및 이용 동의 또는 이용약관 동의에 대하여 체크박스를 클릭할 수 있는 절차를 마련하여, 체크박스를 클릭하면 개인정보 수집에 대해 동의한 것으로 봅니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">2. 개인정보의 수집·이용 목적</strong>
        <p>"개인정보"라 함은 생존하는 개인에 관한 정보로서 당해 정보에 포함되어 있는 성명, 주민등록번호 등의 사항에 의하여 당해 개인을 식별할 수 있는 정보(당해 정보만으로는 특정 개인을 식별할 수 없더라도 다른 정보와 용이하게 결합하여 식별할 수 있는 것을 포함)를 말합니다.</p>
        <p>대부분의 서비스는 별도의 사용자 등록이 없이 언제든지 사용할 수 있습니다. 그러나 (주)학지사는 회원서비스를 통하여 이용자들에게 맞춤식 서비스를 비롯한 보다 더 향상된 양질의 서비스를 제공하기 위하여 이용자 개인의 정보를 수집하고 있습니다. (주)학지사는 이용자의 사전 동의 없이는 이용자의 개인 정보를 공개하지 않으며, 수집된 정보는 아래와 같이 이용하고 있습니다.</p>
        <p>첫째, 이용자들이 제공한 개인정보를 바탕으로 보다 더 유용한 서비스를 개발할 수 있습니다. (주)학지사는 신규 서비스개발이나 컨텐츠의 확충 시에 기존 이용자들이 회사에 제공한 개인정보를 바탕으로 개발해야 할 서비스의 우선 순위를 보다 더 효율적으로 정하고, (주)학지사는 이용자들이 필요로 할 컨텐츠를 합리적으로 선택하여 제공할 수 있습니다.</p>
        <p>둘째, 수집하는 개인정보 항목과 수집 및 이용목적은 다음과 같습니다.</p>
        <ul className="flex flex-col gap-1 list-disc list-inside">
          <li>성명, 아이디, 비밀번호 : 회원제 서비스 이용에 따른 본인 확인 절차에 이용</li>
          <li>이메일주소, 전화번호 : 고지사항 전달, 불만처리 등을 위한 원활한 의사소통 경로의 확보, 새로운 서비스 및 신상품이나 이벤트 정보 등의 안내</li>
          <li>은행계좌정보, 신용카드정보 : 서비스 및 부가 서비스 이용에 대한 요금 결제</li>
          <li>기타 선택항목 : 개인맞춤 서비스를 제공하기 위한 자료</li>
          <li>IP Address : 불량회원의 부정 이용 방지와 비인가 사용 방지 및 통계 수집</li>
        </ul>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">3. 수집하는 개인정보 항목 및 수집방법</strong>
        <p>(주)학지사는 이용자들이 회원서비스를 이용하기 위해 회원으로 가입하실 때 서비스 제공을 위한 필수적인 정보들을 온라인상에서 입력 받고 있습니다. 회원 가입 시에 받는 필수적인 정보는 이름, 생년월일, 성별. 휴대전화번호. 이메일 주소 등입니다. 또한 양질의 서비스 제공을 위하여 이용자들이 선택적으로 입력할 수 있는 사항으로서 전화번호 등을 입력 받고 있습니다.</p>
        <p>또한 사이트 내에서의 설문조사나 이벤트 행사 시 통계분석이나 경품제공 등을 위해 선별적으로 개인정보 입력을 요청할 수 있습니다.</p>
        <p>그러나, 이용자의 기본적 인권 침해의 우려가 있는 민감한 개인정보(인종 및 민족, 사상 및 신조, 출신지 및 본적지, 정치적 성향 및 범죄기록, 건강상태 및 성생활 등)는 수집하지 않으며 부득이하게 수집해야 할 경우 이용자들의 사전동의를 반드시 구할 것입니다. 그리고, 어떤 경우에라도 입력하신 정보를 이용자들에게 사전에 밝힌 목적 이외에 다른 목적으로는 사용하지 않으며 외부로 유출하지 않습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">4. 개인정보의 보유 및 이용기간</strong>
        <p>이용자가 사이트 회원으로서 회사에 제공하는 서비스를 이용하는 동안 (주)학지사는 이용자들의 개인정보를 계속적으로 보유하며 서비스 제공 등을 위해 이용합니다. 다만, 아래의 "6. 이용자 자신의 개인정보관리(열람,정정,삭제 등)에 관한 사항" 에서 설명한 절차와 방법에 따라 회원 본인이 직접 삭제하거나 수정한 정보, 가입해지를 요청한 경우에는 재생할 수 없는 방법에 의하여 디스크에서 완전히 삭제하며 추후 열람이나 이용이 불가능한 상태로 처리됩니다.</p>
        <p>그리고 "3. 수집하는 개인정보 항목 및 수집방법"에서와 같이 일시적인 목적 (설문조사, 이벤트, 본인확인 등)으로 입력 받은 개인정보는 그 목적이 달성된 이후에는 동일한 방법으로 사후 재생이 불가능한 상태로 처리됩니다.</p>
        <p>귀하의 개인정보는 다음과 같이 개인정보의 수집목적 또는 제공받은 목적이 달성되면 파기하는 것을 원칙으로 합니다. 다만, (주)학지사는 불량 회원의 부정한 이용의 재발을 방지하기 위해, 이용계약 해지일로부터 1년간 해당 회원의 주민등록번호를 보유할 수 있습니다.</p>
        <p>그리고 상법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 (주)학지사는 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다. 이 경우 (주)학지사는 보관하는 정보를 그 보관의 목적으로만 이용하며 보존기간은 아래와 같습니다.</p>
        <ul className="flex flex-col gap-1 list-disc list-inside">
          <li>계약 또는 청약철회 등에 관한 기록 : 5년</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록 : 5년</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록 : 3년</li>
        </ul>
        <p>(주)학지사는 귀중한 회원의 개인정보를 안전하게 처리하며, 유출의 방지를 위하여 다음과 같은 방법을 통하여 개인정보를 파기합니다.</p>
        <p>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다. 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">5. 수집한 개인정보의 공유 및 제공</strong>
        <p>(주)학지사는 이용자들의 개인정보를 "2. 개인정보의 수집목적 및 이용목적"에서 고지한 범위 내에서 사용하며, 이용자의 사전 동의 없이는 동 범위를 초과하여 이용하거나 원칙적으로 이용자의 개인정보를 외부에 공개하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
        <ul className="flex flex-col gap-1 list-disc list-inside">
          <li>이용자들이 사전에 공개에 동의한 경우</li>
          <li>서비스 제공에 따른 요금정산을 위하여 필요한 경우</li>
          <li>홈페이지에 게시한 서비스 이용 약관 및 기타 회원 서비스 등의 이용약관 또는 운영원칙을 위반한 경우</li>
          <li>자사 서비스를 이용하여 타인에게 정신적, 물질적 피해를 줌으로써 그에 대한 법적인 조치를 취하기 위하여 개인정보를 공개해야 한다고 판단되는 충분한 근거가 있는 경우</li>
          <li>기타 법에 의해 요구된다고 선의로 판단되는 경우 (ex. 관련법에 의거 적법한 절차에 의한 정부/수사기관의 요청이 있는 경우 등)</li>
          <li>통계작성, 학술연구나 시장조사를 위하여 특정개인을 식별할 수 없는 형태로 광고주, 협력업체나 연구단체 등에 제공하는 경우</li>
          <li>이용자의 서비스 이용에 따른 불만사항 및 문의사항(민원사항)의 처리를 위하여 고객센터를 위탁하는 경우 고객센터를 운영하는 전문업체에 해당 민원사항의 처리에 필요한 개인 정보를 제공하는 경우</li>
        </ul>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">6. 이용자 자신의 개인정보 관리(열람,정정,삭제 등)에 관한 사항</strong>
        <p>회원님이 원하실 경우 언제라도 당사에서 개인정보를 열람하실 수 있으며 보관된 필수 정보를 수정하실 수 있습니다. 또한 회원 가입 시 요구된 필수 정보 외의 추가 정보는 언제나 열람, 수정, 삭제할 수 있습니다. 회원님의 개인정보 변경 및 삭제와 회원탈퇴는 당사의 고객센터에서 로그인(Login) 후 이용하실 수 있습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">7. 쿠키(cookie)의 운영에 관한 사항</strong>
        <p>당사는 회원인증을 위하여 Cookie 방식을 이용하고 있습니다. 이는 로그아웃(Logout)시 자동으로 컴퓨터에 저장되지 않고 삭제되도록 되어 있으므로 공공장소나 타인이 사용할 수 있는 컴퓨터를 사용 하 실 경우에는 로그인(Login)후 서비스 이용이 끝나시면 반드시 로그아웃(Logout)해 주시기 바랍니다.</p>
        <p><strong className="text-[#1E2124]">쿠키 설정 거부 방법</strong> 쿠키 설정을 거부하는 방법으로는 회원님이 사용하시는 웹 브라우저의 옵션을 선택함으로써 모든 쿠키를 허용하거나 쿠키를 저장할 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다. 설정방법 예(인터넷 익스플로어의 경우) : 웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 단, 귀하께서 쿠키 설치를 거부하였을 경우 서비스 제공에 어려움이 있을 수 있습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">8. 비회원고객의 개인정보관리</strong>
        <p>당사는 비회원 고객 또한 물품 및 서비스 상품의 구매를 하실 수 있습니다. 당사는 비회원 주문의 경우 배송 및 대금 결제에 반드시 필요한 개인정보만을 고객님께 요청하고 있습니다.</p>
        <p>당사에서 비회원으로 구입을 하신 경우 비회원 고객께서 입력하신 지불인 정보 및 수령인 정보는 대금 결제 및 상품 배송에 관련한 용도 외에는 다른 어떠한 용도로도 사용되지 않습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">9. 개인정보의 위탁처리</strong>
        <p>회사는 고객님의 동의 없이 고객님의 정보를 외부 업체에 위탁하지 않습니다. 향후 그러한 필요가 생길 경우, 위탁 대상자와 위탁 업무 내용에 대해 고객님에게 통지하고 필요한 경우 사전 동의를 받도록 하겠습니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">10. 개인정보관련 의견수렴 및 불만처리에 관한 사항</strong>
        <p>당사는 개인정보보호와 관련하여 이용자 여러분들의 의견을 수렴하고 있으며 불만을 처리하기 위하여 모든 절차와 방법을 마련하고 있습니다. 이용자들은 하단에 명시한 "11. 개인정보관리책임자 및 담당자의 소속-성명 및 연락처"항을 참고하여 전화나 메일을 통하여 불만사항을신고할 수 있고, (주)학지사는 이용자들의 신고사항에 대하여 신속하고도 충분한 답변을 해 드릴것입니다.</p>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">11. 개인정보 관리책임자 및 담당자의 소속-성명 및 연락처</strong>
        <p>당사는 귀하가 좋은 정보를 안전하게 이용할 수 있도록 최선을 다하고 있습니다. 개인정보를 보호하는데 있어 귀하께 고지한 사항들에 반하는 사고가 발생할 경우 개인정보관리책임자가 책임을 집니다.</p>
        <p>이용자 개인정보와 관련한 아이디(ID)의 비밀번호에 대한 보안유지책임은 해당 이용자 자신에게 있습니다.</p>
        <p>(주)학지사는 비밀번호에 대해 어떠한 방법으로도 이용자에게 직접적으로 질문하는 경우는 없으므로 타인에게 비밀번호가 유출되지 않도록 각별히 주의하시기 바랍니다. 특히 공공장소에서 온라인상에서 접속해 있을 경우에는 더욱 유의하셔야 합니다.</p>
        <p>(주)학지사는 개인정보에 대한 의견수렴 및 불만처리를 담당하는 개인정보 관리책임자 및 담당자를 지정하고 있고, 연락처는 아래와 같습니다.</p>
        <ul className="flex flex-col gap-1 list-disc list-inside">
          <li>이름 : 김 효 근</li>
          <li>전화 : 02-330-5171</li>
          <li>E-mail : webmaster@hakjisa.co.kr</li>
        </ul>
      </section>
      <section className="flex flex-col gap-1">
        <strong className="text-[#1E2124]">12. 고지의 의무</strong>
        <p>현 개인정보취급방침의 내용은 정부의 정책 또는 보안기술의 변경에 따라 내용의 추가 삭제 및 수정이 있을 시에는 홈페이지의 '공지사항'을 통해 고지할 것입니다.</p>
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
                    <option value="" disabled>HCG</option>
                    <option value="https://branding.hakjisa.kr/">HCG 학지사콘텐츠그룹</option>
                    <option value="https://sims.newnonmun.com/">SIMS 학회통합관리시스템</option>
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
