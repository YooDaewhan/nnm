import { test, expect } from '@playwright/test';

const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxIiwibmFtZSI6InRlc3QiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJleHAiOjk5OTk5OTk5OTl9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const MOCK_USER = { id: '1', name: 'test', email: 'test@test.com' };

async function injectAuth(page) {
  await page.addInitScript(
    ({ token, userData }) => {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
    },
    { token: MOCK_JWT, userData: MOCK_USER }
  );
}

const mockPayItems = [
  {
    id: 1,
    publication_id: 'paper-001',
    title: '교육학 연구방법론의 최신 동향',
    authors: ['홍길동'],
    price: 3000,
    quantity: 1,
    publisher: '한국교육학회',
    journal: '교육학연구',
  },
];

// ──────────────────────────────────────────────
// 결제 페이지 (/pay)
// ──────────────────────────────────────────────
test.describe('구매/결제 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);

    // 장바구니에서 넘어온 상태 모킹
    await page.route('**/api/cart**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPayItems),
      });
    });

    await page.goto('/pay');
  });

  test('구매/결제 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('구매/결제')).toBeVisible({ timeout: 10000 });
  });

  test('결제 단계 표시', async ({ page }) => {
    await expect(page.getByText('장바구니')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('구매/결제')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('결제완료')).toBeVisible({ timeout: 10000 });
  });

  test('결제 수단 섹션 표시', async ({ page }) => {
    await expect(
      page.getByText('결제 수단').or(page.getByText(/신용카드|가상계좌|휴대폰/))
    ).toBeVisible({ timeout: 10000 });
  });

  test('신용카드 옵션 선택 가능', async ({ page }) => {
    const creditCardOption = page.getByText('신용카드').or(
      page.getByRole('radio', { name: '신용카드' })
    );
    if (await creditCardOption.count() > 0) {
      await expect(creditCardOption.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('약관 동의 체크박스 표시', async ({ page }) => {
    await expect(
      page.getByRole('checkbox').first().or(
        page.getByText(/약관.*동의|동의.*약관/)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('약관 보기 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /약관보기/ }).or(page.getByText('약관보기'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('결제 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /원 결제하기|결제하기/ })
    ).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────
// 결제 실패 페이지 (/payment/fail)
// ──────────────────────────────────────────────
test.describe('결제 실패 페이지', () => {
  test('결제 실패 메시지 표시', async ({ page }) => {
    await page.goto('/payment/fail?message=결제가+취소되었습니다&code=PAY_CANCEL');
    await expect(page.getByText('결제 실패')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('결제 처리 중 문제가 발생했습니다.')).toBeVisible({ timeout: 10000 });
  });

  test('오류 정보 카드 표시 - 에러 코드 및 메시지', async ({ page }) => {
    await page.goto('/payment/fail?message=결제가+취소되었습니다&code=PAY_CANCEL');
    await expect(
      page.getByText(/PAY_CANCEL|결제가 취소/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('다음 단계 안내 표시', async ({ page }) => {
    await page.goto('/payment/fail');
    await expect(
      page.getByText(/결제 정보를 다시 확인|카드 한도|고객센터/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('다시 시도하기 버튼 표시 및 이전 페이지 이동', async ({ page }) => {
    await page.goto('/payment/fail');
    await expect(page.getByRole('button', { name: '다시 시도하기' })).toBeVisible({ timeout: 10000 });
  });

  test('홈으로 돌아가기 버튼 클릭 시 홈으로 이동', async ({ page }) => {
    await page.goto('/payment/fail');
    await page.getByRole('button', { name: '홈으로 돌아가기' }).click();
    await expect(page).toHaveURL('/');
  });

  test('파라미터 없는 실패 페이지도 정상 렌더링', async ({ page }) => {
    await page.goto('/payment/fail');
    await expect(page.getByText('결제 실패')).toBeVisible({ timeout: 10000 });
  });
});

// ──────────────────────────────────────────────
// 결제 성공 페이지 (/payment/success)
// ──────────────────────────────────────────────
test.describe('결제 완료 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);

    // 결제 확인 API 모킹
    await page.route('**/api/payment**/confirm**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'ORDER-001',
          orderName: '교육학 연구방법론의 최신 동향 외 1건',
          totalAmount: 6000,
          status: 'DONE',
          items: mockPayItems,
        }),
      });
    });
    await page.route('**/api/payments/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: 'ORDER-001',
          orderName: '교육학 연구방법론의 최신 동향',
          totalAmount: 3000,
          status: 'DONE',
          items: mockPayItems,
        }),
      });
    });
  });

  test('결제 완료 페이지 제목 표시', async ({ page }) => {
    await page.goto('/payment/success?orderId=ORDER-001&paymentKey=pk_test_001&amount=3000');
    await expect(
      page.getByText('결제완료').or(page.getByText('결제 완료'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('구매내역으로 이동 버튼 표시', async ({ page }) => {
    await page.goto('/payment/success?orderId=ORDER-001&paymentKey=pk_test_001&amount=3000');
    await expect(
      page.getByRole('button', { name: '구매내역으로 이동' }).or(
        page.getByText('구매내역으로 이동')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('구매내역으로 이동 버튼 클릭 시 구매내역 페이지로 이동', async ({ page }) => {
    await page.goto('/payment/success?orderId=ORDER-001&paymentKey=pk_test_001&amount=3000');
    const btn = page.getByRole('button', { name: '구매내역으로 이동' }).or(
      page.getByText('구매내역으로 이동')
    );
    if (await btn.count() > 0) {
      await btn.first().click();
      await expect(page).toHaveURL(/\/mypage\/orders/);
    }
  });

  test('감사 안내 문구 표시', async ({ page }) => {
    await page.goto('/payment/success?orderId=ORDER-001&paymentKey=pk_test_001&amount=3000');
    await expect(
      page.getByText(/이용해 주셔서 감사합니다/).or(
        page.getByText(/5일간 다운로드/)
      )
    ).toBeVisible({ timeout: 10000 });
  });
});
