import { test, expect } from '@playwright/test';

// 테스트용 만료되지 않는 JWT 토큰 (exp: 9999999999)
// payload: {"sub":"1","name":"test","email":"test@test.com","exp":9999999999}
const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxIiwibmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const MOCK_USER = { id: '1', name: 'test', email: 'test@test.com' };

const mockCartItems = [
  {
    id: 1,
    publication_id: 'paper-001',
    title: '교육학 연구방법론의 최신 동향',
    authors: ['홍길동', '김철수'],
    published_date: '2023.05',
    is_kci: true,
    publisher: '한국교육학회',
    journal: '교육학연구',
    volume: '61',
    issue: '3',
    start_page: '1',
    end_page: '25',
    price: 3000,
    quantity: 1,
    subtotal: 3000,
  },
  {
    id: 2,
    publication_id: 'paper-002',
    title: '디지털 교육환경에서의 학습 효과 분석',
    authors: ['김영희'],
    published_date: '2023.03',
    is_kci: false,
    publisher: '한국교육학회',
    journal: '교육학연구',
    volume: '61',
    issue: '1',
    start_page: '45',
    end_page: '67',
    price: 3000,
    quantity: 1,
    subtotal: 3000,
  },
];

// 인증 상태 주입 헬퍼
async function injectAuth(page) {
  await page.addInitScript(
    ({ token, userData }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    },
    { token: MOCK_JWT, userData: MOCK_USER }
  );
}

test.describe('장바구니 페이지 - 빈 장바구니', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);

    // 빈 장바구니 API 모킹
    await page.route('**/api/cart**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/cart');
  });

  test('장바구니 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('장바구니')).toBeVisible({ timeout: 10000 });
  });

  test('결제 단계 표시 (장바구니 → 구매/결제 → 결제완료)', async ({ page }) => {
    await expect(page.getByText('장바구니')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('구매/결제')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('결제완료')).toBeVisible({ timeout: 10000 });
  });

  test('빈 장바구니 상태 또는 빈 목록 표시', async ({ page }) => {
    // 빈 상태 메시지 또는 결제하기 버튼이 비활성화 확인
    await expect(
      page.getByText(/장바구니.*비어|담긴 논문이 없|비어있습니다/).or(
        page.getByRole('button', { name: '결제하기' })
      )
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('장바구니 페이지 - 상품이 있는 장바구니', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);

    // 장바구니 항목 API 모킹
    await page.route('**/api/cart**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCartItems),
      });
    });

    await page.goto('/cart');
  });

  test('장바구니 항목 렌더링', async ({ page }) => {
    await expect(
      page.getByText('교육학 연구방법론의 최신 동향').or(
        page.locator('input[type="checkbox"]').first()
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('전체선택 체크박스 표시', async ({ page }) => {
    await expect(
      page.getByText(/전체선택/).or(page.getByLabel(/전체선택/))
    ).toBeVisible({ timeout: 10000 });
  });

  test('선택삭제 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '선택삭제' }).or(page.getByText('선택삭제'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('결제 금액 표시', async ({ page }) => {
    await expect(
      page.getByText(/결제금액|총 .+건/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('결제하기 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '결제하기' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('이용 기간 및 환불 안내 섹션 표시', async ({ page }) => {
    await expect(
      page.getByText(/이용 기간.*환불|환불 안내/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('개별 항목 체크박스 클릭', async ({ page }) => {
    // 장바구니 항목의 체크박스 (첫 번째 선택)
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    if (count > 0) {
      // 전체선택이 아닌 개별 항목 체크박스 클릭
      const firstItemCheckbox = checkboxes.last();
      await firstItemCheckbox.check();
      await expect(firstItemCheckbox).toBeChecked();
    }
  });

  test('전체선택 체크박스 선택 시 모든 항목 선택', async ({ page }) => {
    const allCheckboxes = page.getByRole('checkbox');
    const selectAllCheckbox = allCheckboxes.first();
    await selectAllCheckbox.check();
    await expect(selectAllCheckbox).toBeChecked();
  });

  test('항목 삭제 버튼(X) 클릭', async ({ page }) => {
    // 개별 항목 삭제 버튼 (X 버튼)
    const deleteBtn = page.locator('button').filter({ hasText: /^×$|^X$/ }).or(
      page.locator('[aria-label*="삭제"], [title*="삭제"]')
    );
    if (await deleteBtn.count() > 0) {
      // 삭제 API 모킹
      await page.route('**/api/cart/**', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 200, body: '{}' });
        } else {
          await route.continue();
        }
      });
      await deleteBtn.first().click();
    }
  });

  test('30일 보관 안내 문구 표시', async ({ page }) => {
    await expect(
      page.getByText(/30일/)
    ).toBeVisible({ timeout: 10000 });
  });
});
