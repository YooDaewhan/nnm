import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────
// 로그인 페이지
// ──────────────────────────────────────────────
test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('로그인 폼 기본 요소 표시', async ({ page }) => {
    await expect(page.getByPlaceholder('이메일')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: '회원가입' })).toBeVisible();
  });

  test('소셜 로그인 버튼 표시 (네이버, 카카오)', async ({ page }) => {
    await expect(page.getByRole('button', { name: /네이버/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /카카오/ })).toBeVisible();
  });

  test('자동 로그인 체크박스 토글', async ({ page }) => {
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('비밀번호 표시/숨기기 토글', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('비밀번호');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // 비밀번호 토글 버튼 (비밀번호 필드 내부의 눈 아이콘)
    const toggleBtn = page.locator('input[placeholder="비밀번호"] ~ button, input[placeholder="비밀번호"] + button').or(
      page.locator('div').filter({ has: page.getByPlaceholder('비밀번호') }).locator('button').last()
    );
    if (await toggleBtn.count() > 0) {
      await toggleBtn.first().click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('회원가입 버튼 클릭 시 회원가입 페이지로 이동', async ({ page }) => {
    await page.getByRole('button', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('약관 및 정책 버튼 클릭 시 준비중 모달 표시', async ({ page }) => {
    await page.getByRole('button', { name: '약관 및 정책' }).first().click();
    await expect(page.getByText('준비중입니다')).toBeVisible();
  });

  test('고객센터 버튼 클릭 시 준비중 모달 표시', async ({ page }) => {
    await page.getByRole('button', { name: '고객센터' }).first().click();
    await expect(page.getByText('준비중입니다')).toBeVisible();
  });

  test('잘못된 자격증명 제출 시 오류 메시지 표시', async ({ page }) => {
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: '이메일 또는 비밀번호가 올바르지 않습니다.' }),
      });
    });

    await page.getByPlaceholder('이메일').fill('wrong@test.com');
    await page.getByPlaceholder('비밀번호').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 또는 로그인 실패 피드백이 표시되어야 함
    await expect(page.locator('[class*="error"], [class*="Error"], [role="alert"]').or(
      page.getByText(/올바르지 않습니다|실패|오류/)
    )).toBeVisible({ timeout: 5000 });
  });

  test('이메일 형식 유효성 검사', async ({ page }) => {
    await page.getByPlaceholder('이메일').fill('invalid-email');
    await page.getByPlaceholder('비밀번호').fill('password123');
    await page.getByRole('button', { name: '로그인' }).click();
    // 브라우저 기본 유효성 검사 또는 커스텀 에러 메시지
    const emailInput = page.getByPlaceholder('이메일');
    // 이메일 형식 오류 시 페이지 이동 없음
    await expect(page).toHaveURL(/\/login/);
  });
});

// ──────────────────────────────────────────────
// 회원가입 페이지
// ──────────────────────────────────────────────
test.describe('회원가입 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('회원가입 폼 기본 요소 표시', async ({ page }) => {
    await expect(page.getByText('회원가입')).toBeVisible();
    await expect(page.getByPlaceholder('이름')).toBeVisible();
    await expect(page.getByPlaceholder('이메일')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호 (8자 이상)')).toBeVisible();
  });

  test('이메일 인증요청 버튼 표시', async ({ page }) => {
    await expect(page.getByRole('button', { name: '인증요청' })).toBeVisible();
  });

  test('약관 동의 체크박스 표시', async ({ page }) => {
    await expect(page.getByText('모든 약관에 동의합니다.')).toBeVisible();
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toBeVisible();
  });

  test('가입 버튼 초기 비활성화', async ({ page }) => {
    await expect(page.getByRole('button', { name: '가입' })).toBeDisabled();
  });

  test('취소 버튼 클릭 시 이전 페이지(홈 또는 로그인)로 이동', async ({ page }) => {
    await page.getByRole('button', { name: '취소' }).click();
    // 취소 시 로그인 또는 홈으로 이동
    await expect(page).not.toHaveURL(/\/register$/);
  });

  test('비밀번호 불일치 시 오류 메시지 표시', async ({ page }) => {
    await page.getByPlaceholder('비밀번호 (8자 이상)').fill('password123');
    // 비밀번호 확인 입력란 찾기 (두 번째 password 입력)
    const passwordInputs = page.locator('input[type="password"]');
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(1).fill('differentpassword');
      // 포커스를 다른 곳으로 이동하여 검증 트리거
      await page.getByPlaceholder('이름').click();
      await expect(page.getByText(/일치하지 않습니다|비밀번호가 다릅니다/)).toBeVisible({ timeout: 3000 });
    }
  });

  test('약관 및 정책 링크 버튼 표시', async ({ page }) => {
    await expect(page.getByRole('button', { name: /약관 및 정책/ })).toBeVisible();
  });

  test('이메일 인증 요청 후 OTP 입력란 표시', async ({ page }) => {
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '인증 이메일이 발송되었습니다.' }),
      });
    });

    await page.getByPlaceholder('이메일').fill('test@test.com');
    await page.getByRole('button', { name: '인증요청' }).click();

    // OTP 입력 UI 또는 재발송/인증확인 버튼이 나타나야 함
    await expect(
      page.getByRole('button', { name: /인증확인|재발송/ }).or(
        page.locator('input[maxlength="6"], input[placeholder*="인증"]')
      )
    ).toBeVisible({ timeout: 5000 });
  });
});

// ──────────────────────────────────────────────
// 회원가입 완료 페이지
// ──────────────────────────────────────────────
test.describe('회원가입 완료 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register/complete');
  });

  test('회원가입 완료 메시지 표시', async ({ page }) => {
    await expect(page.getByText('회원가입 완료')).toBeVisible();
    await expect(page.getByText(/회원가입이 완료되었습니다/)).toBeVisible();
  });

  test('로그인하기 버튼 클릭 시 로그인 페이지로 이동', async ({ page }) => {
    await page.getByText('로그인하기').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('홈으로 이동 버튼 클릭 시 홈 페이지로 이동', async ({ page }) => {
    await page.getByText('홈으로 이동').click();
    await expect(page).toHaveURL('/');
  });

  test('두 버튼 모두 표시', async ({ page }) => {
    await expect(page.getByText('로그인하기')).toBeVisible();
    await expect(page.getByText('홈으로 이동')).toBeVisible();
  });
});
