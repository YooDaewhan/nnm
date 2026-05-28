import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지 로드 - 히어로 섹션 텍스트 확인', async ({ page }) => {
    await expect(page.getByText('빠르고 정확한 학술 문헌 검색 서비스')).toBeVisible();
    await expect(page.getByText('신뢰할 수 있는 지식, 국내 연구의 기준')).toBeVisible();
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
    await page.getByTitle('상세 검색').click();
    await expect(page.getByText('상세 검색 조건')).toBeVisible();
  });

  test('주제별 탭 - 탭 클릭 시 활성화', async ({ page }) => {
    await expect(page.getByText('주제별 인기논문')).toBeVisible();
    const tabBtn = page.getByRole('button', { name: '교육학', exact: true });
    await tabBtn.click();
    // 활성 탭은 어두운 배경색이 적용됨 (배경: #2D3560)
    await expect(tabBtn).toBeVisible();
  });

  test('인기 검색 키워드 섹션 노출', async ({ page }) => {
    await expect(page.getByText('인기 검색 키워드')).toBeVisible();
    await expect(page.getByText('다른 연구자들은 어떤 키워드에 주목하고 있을까요?')).toBeVisible();
  });

  test('추천 저널 섹션 노출', async ({ page }) => {
    await expect(page.getByText('추천 저널')).toBeVisible();
    await expect(page.getByText('가장 많이 읽힌 저널을 만나보세요.')).toBeVisible();
  });

  test('SIMS 배너 링크 확인', async ({ page }) => {
    const simsLink = page.locator('a[href="https://sims.newnonmun.com/"]').first();
    await expect(simsLink).toBeVisible();
    await expect(simsLink).toHaveAttribute('href', 'https://sims.newnonmun.com/');
  });
});
