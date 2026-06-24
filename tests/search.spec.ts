import { test, expect } from '@playwright/test';

test.describe('검색 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search?q=교육');
  });

  test('검색 결과 헤더 - 검색어 표시 확인', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /교육.*에 대한 검색결과/ })).toBeVisible();
  });

  test('검색 결과 건수 표시', async ({ page }) => {
    await expect(page.getByText(/검색 결과 .+건/)).toBeVisible();
  });

  test('정렬 드롭다운 - 정확도순/최신순 선택', async ({ page }) => {
    const sortSelect = page.getByRole('combobox').filter({ hasText: /정확도순|최신순/ }).first();
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption({ label: '최신순' });
    await expect(sortSelect).toHaveValue('latest');
  });

  test('페이지 크기 드롭다운 - 20개씩으로 변경', async ({ page }) => {
    const pageSizeSelect = page.locator('select:visible').filter({
      has: page.locator('option[value="20"]'),
    });
    await expect(pageSizeSelect).toBeVisible();
    await pageSizeSelect.selectOption('20');
    await expect(pageSizeSelect).toHaveValue('20');
  });

  test('검색 결과 카드 - 카드 목록 렌더링 확인', async ({ page }) => {
    // 카드 컨테이너가 1개 이상 존재해야 함
    const cards = page.locator('div').filter({ has: page.locator('h4') });
    await expect(cards.first()).toBeVisible();
  });

  test('체크박스 - 카드 체크박스 클릭', async ({ page }) => {
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
  });

  test('필터 사이드바 - 출판연도 필터 (1년)', async ({ page }) => {
    await page.getByRole('button', { name: '발행일' }).click();
    const yearBtn = page.getByRole('button', { name: '1년' });
    await expect(yearBtn).toBeVisible();
    await yearBtn.click();
    await expect(yearBtn).toBeVisible();
  });

  test('필터 사이드바 - 결과 내 검색 입력', async ({ page }) => {
    const innerSearchInput = page.getByPlaceholder('검색어 또는 질문을 입력하세요.');
    await expect(innerSearchInput).toBeVisible();
    await innerSearchInput.fill('심리');
    await innerSearchInput.press('Enter');
  });

  test('필터 초기화 버튼 동작', async ({ page }) => {
    // 연도 필터 적용 후 초기화
    await page.getByRole('button', { name: '발행일' }).click();
    const yearBtn = page.getByRole('button', { name: '3년' });
    await yearBtn.click();
    const resetBtn = page.getByRole('button', { name: '초기화' }).last();
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
  });

  test('헤더 초기화 버튼 - 검색 조건 배지 제거', async ({ page }) => {
    // 검색 헤더의 초기화 버튼 확인
    const resetBtn = page.getByRole('button', { name: /초기화/ }).first();
    await expect(resetBtn).toBeVisible();
  });
});
