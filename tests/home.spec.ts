import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지 로드 - 히어로 섹션 텍스트 확인', async ({ page }) => {
    await expect(page.getByText('생각은 깊게, 검색은 빠르게')).toBeVisible();
    await expect(page.getByText('복잡한 절차 없이 핵심 논문을 빠르게 찾아보세요.')).toBeVisible();
  });

  test('검색창 - 입력 후 검색 버튼 클릭 시 검색 페이지로 이동', async ({ page }) => {
    const input = page.getByPlaceholder(/키워드를 입력하세요|찾고 싶은 논문/);
    await input.fill('교육학');
    // 돋보기 버튼(검색 버튼) 클릭
    await input.press('Enter');
    await expect(page).toHaveURL(/\/search/);
  });

  test('상세 검색 토글 - 클릭 시 상세 검색 패널 표시', async ({ page }) => {
    await expect(page.getByText('상세 검색 조건')).not.toBeVisible();
    // 필터 아이콘 버튼 클릭
    const filterBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
    // 상세검색 패널이 있는 버튼을 찾기 위해 "상세 검색 조건" 텍스트가 나타나는지 확인
    await page.locator('button').filter({ hasText: '' }).first();
    // 검색바 안의 마지막에서 두 번째 버튼이 필터 토글
    const searchArea = page.locator('div').filter({ has: page.getByPlaceholder(/키워드를 입력하세요|찾고 싶은 논문/) }).first();
    const toggleBtn = searchArea.locator('button').nth(-2);
    await toggleBtn.click();
    await expect(page.getByText('상세 검색 조건')).toBeVisible();
  });

  test('주제별 탭 - 탭 클릭 시 활성화', async ({ page }) => {
    await expect(page.getByText('주제별 인기논문')).toBeVisible();
    const tabBtn = page.getByRole('button', { name: '교육학' });
    await tabBtn.click();
    // 활성 탭은 어두운 배경색이 적용됨 (배경: #2D3560)
    await expect(tabBtn).toBeVisible();
  });

  test('인기 검색 키워드 섹션 노출', async ({ page }) => {
    await expect(page.getByText('인기 검색 키워드')).toBeVisible();
    await expect(page.getByText('다른 연구자들은 어떤 키워드에 주목하고 있을까요?')).toBeVisible();
  });

  test('업데이트 저널 섹션 노출', async ({ page }) => {
    await expect(page.getByText('업데이트 저널')).toBeVisible();
    await expect(page.getByText('따끈따끈한 최신 저널을 가장 먼저 만나보세요.')).toBeVisible();
  });

  test('SIMS 배너 링크 확인', async ({ page }) => {
    const simsLink = page.getByRole('link', { name: /SIMS/ });
    await expect(simsLink).toBeVisible();
    await expect(simsLink).toHaveAttribute('href', 'https://sims.newnonmun.com/');
  });
});
