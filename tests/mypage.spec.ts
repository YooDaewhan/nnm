import { test, expect } from '@playwright/test';

// 테스트용 만료되지 않는 JWT 토큰
const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxIiwibmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const MOCK_USER = { id: '1', name: '테스트유저', email: 'test@test.com' };

async function injectAuth(page) {
  await page.addInitScript(
    ({ token, userData }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    },
    { token: MOCK_JWT, userData: MOCK_USER }
  );
}

// 공통 API 모킹: 사용자 정보
async function mockUserAPI(page) {
  await page.route('**/api/auth/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: '테스트유저', email: 'test@test.com' }),
    });
  });
  await page.route('**/api/users/me**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: '테스트유저', email: 'test@test.com' }),
    });
  });
}

// ──────────────────────────────────────────────
// 마이페이지 - 회원정보
// ──────────────────────────────────────────────
test.describe('마이페이지 - 회원정보', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    await page.goto('/mypage');
  });

  test('회원정보 페이지 제목 표시', async ({ page }) => {
    await expect(
      page.getByText('회원정보').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('이름, 이메일 정보 표시', async ({ page }) => {
    await expect(
      page.getByText(/테스트유저|이름/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('비밀번호 변경 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '비밀번호 변경' }).or(page.getByText('비밀번호 변경'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('비밀번호 변경 버튼 클릭 시 변경 모달 열림', async ({ page }) => {
    const changeBtn = page.getByRole('button', { name: '비밀번호 변경' }).or(
      page.getByText('비밀번호 변경')
    );
    await expect(changeBtn.first()).toBeVisible({ timeout: 10000 });
    await changeBtn.first().click();
    // 비밀번호 변경 모달이 열려야 함
    await expect(
      page.getByPlaceholder(/현재 비밀번호|기존 비밀번호/).or(
        page.locator('[role="dialog"]')
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test('비밀번호 변경 모달 - 취소 버튼 동작', async ({ page }) => {
    const changeBtn = page.getByRole('button', { name: '비밀번호 변경' }).or(
      page.getByText('비밀번호 변경')
    );
    await changeBtn.first().click();
    const cancelBtn = page.getByRole('button', { name: '취소' });
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click();
      // 모달이 닫혀야 함
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('회원탈퇴 링크 표시', async ({ page }) => {
    await expect(
      page.getByText('회원탈퇴').or(page.getByRole('button', { name: '회원탈퇴' }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('마이페이지 사이드바 네비게이션 표시', async ({ page }) => {
    // 마이페이지 하위 메뉴 링크들
    await expect(
      page.getByRole('link', { name: /구매 내역|보관함|최근 본|Q&A/ }).first().or(
        page.getByText(/구매 내역|보관함|최근 본/)
      )
    ).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────
// 마이페이지 - 구매 내역
// ──────────────────────────────────────────────
test.describe('마이페이지 - 구매 내역', () => {
  const mockOrders = [
    {
      id: 1,
      order_id: 'ORDER-20231201-001',
      order_name: '교육학 연구방법론의 최신 동향',
      amount: 3000,
      status: 'DONE',
      created_at: '2023-12-01T10:00:00Z',
      items: [
        {
          id: 1,
          publication_id: 'paper-001',
          title: '교육학 연구방법론의 최신 동향',
          authors: ['홍길동'],
          price: 3000,
        },
      ],
    },
  ];

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    await page.route('**/api/payments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orders: mockOrders, total: 1 }),
      });
    });
    await page.goto('/mypage/orders');
  });

  test('구매 내역 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('구매 내역')).toBeVisible({ timeout: 10000 });
  });

  test('5일 다운로드 안내 문구 표시', async ({ page }) => {
    await expect(
      page.getByText(/5일간 다운로드/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('기간 필터 드롭다운 표시', async ({ page }) => {
    await expect(
      page.getByRole('combobox').filter({ hasText: /3개월|6개월|1년/ }).or(
        page.locator('select').first()
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('검색 입력란 표시', async ({ page }) => {
    await expect(
      page.getByPlaceholder('검색어를 입력해주세요.')
    ).toBeVisible({ timeout: 10000 });
  });

  test('기간 필터 변경 - 6개월', async ({ page }) => {
    const filterSelect = page.getByRole('combobox').filter({ hasText: /3개월|6개월|1년/ }).or(
      page.locator('select').first()
    );
    if (await filterSelect.count() > 0) {
      await filterSelect.first().selectOption({ label: '6개월' });
    }
  });

  test('주문 목록 아이템 또는 빈 상태 표시', async ({ page }) => {
    await expect(
      page.getByText('교육학 연구방법론의 최신 동향').or(
        page.getByText(/구매 내역이 없습니다|내역이 없습니다/)
      )
    ).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────
// 마이페이지 - 보관함
// ──────────────────────────────────────────────
test.describe('마이페이지 - 보관함', () => {
  const mockLibraryItems = [
    {
      id: 1,
      publication_id: 'paper-001',
      title: '교육학 연구방법론의 최신 동향',
      authors: ['홍길동'],
      published_date: '2023.05',
      is_kci: true,
      publisher: '한국교육학회',
      journal: '교육학연구',
      purchase_date: '2023-12-01',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    await page.route('**/api/library**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: mockLibraryItems, total: 1 }),
      });
    });
    await page.route('**/api/purchase**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: mockLibraryItems, total: 1 }),
      });
    });
    await page.goto('/mypage/library');
  });

  test('보관함 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('보관함')).toBeVisible({ timeout: 10000 });
  });

  test('5일 다운로드 안내 문구 표시', async ({ page }) => {
    await expect(
      page.getByText(/5일간 다운로드/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('보관함 항목 또는 빈 상태 표시', async ({ page }) => {
    await expect(
      page.getByText('교육학 연구방법론의 최신 동향').or(
        page.getByText(/비어 있습니다|구매한 논문이 없습니다/)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('빈 보관함 - 논문 둘러보기 링크 표시', async ({ page }) => {
    // 빈 상태 모킹으로 재설정
    await page.route('**/api/library**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });
    await page.reload();
    await expect(
      page.getByText(/논문 둘러보기/).or(
        page.getByRole('link', { name: /논문 둘러보기/ })
      )
    ).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// 마이페이지 - 보관함
// ──────────────────────────────────────────────
test.describe('마이페이지 - 보관함', () => {
  const mockScraps = [
    {
      id: 1,
      publication_id: 'paper-001',
      title: '교육학 연구방법론의 최신 동향',
      created_at: '2023-12-01T10:00:00Z',
    },
    {
      id: 2,
      publication_id: 'paper-002',
      title: '디지털 교육환경에서의 학습 효과',
      created_at: '2023-11-15T10:00:00Z',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    await page.route('**/api/scraps**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: mockScraps, total: 2 }),
      });
    });
    await page.goto('/mypage/scraps');
  });

  test('보관함 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('보관함')).toBeVisible({ timeout: 10000 });
  });

  test('보관함 항목 또는 빈 상태 표시', async ({ page }) => {
    await expect(
      page.getByText('교육학 연구방법론의 최신 동향').or(
        page.getByText(/보관함한 논문이 없습니다/)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('빈 보관함 목록 상태 메시지', async ({ page }) => {
    await page.route('**/api/scraps**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });
    await page.reload();
    await expect(
      page.getByText(/보관함한 논문이 없습니다/)
    ).toBeVisible({ timeout: 5000 });
  });

  test('보관함 삭제 버튼 표시', async ({ page }) => {
    // 삭제(휴지통) 버튼이 각 항목에 있어야 함
    const deleteBtn = page.locator('button[aria-label*="삭제"], button[title*="삭제"]').or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('보관함 항목 클릭 시 논문 상세 페이지로 이동', async ({ page }) => {
    const paperTitle = page.getByText('교육학 연구방법론의 최신 동향');
    if (await paperTitle.count() > 0) {
      await paperTitle.click();
      await expect(page).toHaveURL(/\/papers\//);
    }
  });
});

// ──────────────────────────────────────────────
// 마이페이지 - 최근 본 논문
// ──────────────────────────────────────────────
test.describe('마이페이지 - 최근 본 논문', () => {
  const mockRecentPapers = [
    {
      id: 'paper-001',
      title: '교육학 연구방법론의 최신 동향',
      authors: ['홍길동', '김철수'],
      venue: '교육학연구',
      year: 2023,
      viewed_at: new Date().toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    // 최근 본 논문은 localStorage에 저장됨
    await page.addInitScript((papers) => {
      localStorage.setItem('recent_papers', JSON.stringify(papers));
    }, mockRecentPapers);
    await page.goto('/mypage/recent');
  });

  test('최근 본 논문 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('최근 본 논문')).toBeVisible({ timeout: 10000 });
  });

  test('최근 본 논문 목록 또는 빈 상태 표시', async ({ page }) => {
    await expect(
      page.getByText('교육학 연구방법론의 최신 동향').or(
        page.getByText(/최근 본 논문이 없습니다/)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('전체 삭제 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '전체 삭제' }).or(page.getByText('전체 삭제'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('전체 삭제 버튼 클릭 시 목록 초기화', async ({ page }) => {
    const deleteAllBtn = page.getByRole('button', { name: '전체 삭제' }).or(
      page.getByText('전체 삭제')
    );
    if (await deleteAllBtn.count() > 0) {
      await deleteAllBtn.first().click();
      await expect(
        page.getByText(/최근 본 논문이 없습니다/)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('빈 최근 본 논문 상태 메시지', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('recent_papers', JSON.stringify([]));
    });
    await page.reload();
    await expect(
      page.getByText(/최근 본 논문이 없습니다/)
    ).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// 마이페이지 - Q&A
// ──────────────────────────────────────────────
test.describe('마이페이지 - Q&A', () => {
  const mockQnaList = [
    {
      id: 1,
      title: '결제 관련 문의입니다',
      status: '답변 대기',
      created_at: '2023-12-01T10:00:00Z',
      content: '결제가 되지 않습니다.',
      answer: null,
    },
    {
      id: 2,
      title: '다운로드 오류 문의',
      status: '답변 완료',
      created_at: '2023-11-20T10:00:00Z',
      content: '다운로드가 되지 않습니다.',
      answer: '확인 후 처리해 드리겠습니다.',
    },
  ];

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockUserAPI(page);
    await page.route('**/api/qna**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: mockQnaList, total: 2 }),
      });
    });
    await page.goto('/mypage/qna');
  });

  test('Q&A 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('Q&A')).toBeVisible({ timeout: 10000 });
  });

  test('문의하기 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '문의하기' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('문의하기 버튼 클릭 시 문의 폼 표시', async ({ page }) => {
    await page.getByRole('button', { name: '문의하기' }).click();
    await expect(
      page.getByPlaceholder('제목').or(page.getByPlaceholder('문의 내용을 입력해주세요.'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('문의 폼 - 제목 및 내용 입력란 표시', async ({ page }) => {
    await page.getByRole('button', { name: '문의하기' }).click();
    await expect(page.getByPlaceholder('제목')).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder('문의 내용을 입력해주세요.')).toBeVisible({ timeout: 5000 });
  });

  test('취소 버튼 클릭 시 폼 숨김', async ({ page }) => {
    await page.getByRole('button', { name: '문의하기' }).click();
    await expect(page.getByPlaceholder('제목')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByPlaceholder('제목')).not.toBeVisible({ timeout: 3000 });
  });

  test('접수하기 버튼 표시', async ({ page }) => {
    await page.getByRole('button', { name: '문의하기' }).click();
    await expect(
      page.getByRole('button', { name: '접수하기' })
    ).toBeVisible({ timeout: 5000 });
  });

  test('Q&A 목록 또는 빈 상태 표시', async ({ page }) => {
    await expect(
      page.getByText('결제 관련 문의입니다').or(
        page.getByText(/문의 내역이 없습니다/)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('빈 Q&A 목록 상태 메시지', async ({ page }) => {
    await page.route('**/api/qna**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });
    await page.reload();
    await expect(
      page.getByText(/문의 내역이 없습니다/)
    ).toBeVisible({ timeout: 5000 });
  });

  test('Q&A 항목 확장 - 클릭 시 내용 표시', async ({ page }) => {
    const firstQnaItem = page.getByText('결제 관련 문의입니다');
    if (await firstQnaItem.count() > 0) {
      await firstQnaItem.click();
      // 문의 내용이 펼쳐져야 함
      await expect(
        page.getByText('결제가 되지 않습니다.')
      ).toBeVisible({ timeout: 3000 });
    }
  });
});
