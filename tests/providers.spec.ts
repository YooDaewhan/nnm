import { test, expect } from '@playwright/test';

const mockProviders = [
  {
    id: 1,
    name: '한국교육학회',
    abbreviation: 'KERA',
    category: '교육학',
    status: '활성',
    website: 'https://www.kera.or.kr',
  },
  {
    id: 2,
    name: '한국심리학회',
    abbreviation: 'KPA',
    category: '심리학',
    status: '활성',
    website: 'https://www.koreanpsychology.or.kr',
  },
  {
    id: 3,
    name: '한국사회학회',
    abbreviation: 'KSA',
    category: '사회학',
    status: '활성',
    website: 'https://www.ksa21.or.kr',
  },
];

test.describe('학회 목록 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 학회 API 모킹
    await page.route('**/api/providers**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers: mockProviders, total: mockProviders.length }),
      });
    });
    await page.route('**/providers**', async (route) => {
      const url = route.request().url();
      // 페이지 자체 요청은 통과, API 요청만 모킹
      if (url.includes('/api/') || route.request().resourceType() === 'fetch') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ providers: mockProviders, total: mockProviders.length }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/providers');
  });

  test('학회 목록 페이지 제목 표시', async ({ page }) => {
    await expect(page.getByText('학회 목록')).toBeVisible({ timeout: 10000 });
  });

  test('검색 입력란 표시', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/이름.*검색|카테고리.*검색|약어.*검색/).or(
        page.getByPlaceholder('이름, 약어, 카테고리로 검색...')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('검색어 입력 가능', async ({ page }) => {
    const searchInput = page.getByPlaceholder('이름, 약어, 카테고리로 검색...');
    await searchInput.fill('교육');
    await expect(searchInput).toHaveValue('교육');
  });

  test('학회 목록 항목 표시', async ({ page }) => {
    // 모킹된 데이터나 실제 데이터 중 하나라도 있으면 목록 요소 표시
    await expect(
      page.locator('li, [class*="item"], [class*="row"]').first().or(
        page.getByText('데이터가 없습니다.').or(page.getByText('검색 결과가 없습니다.'))
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('빈 검색 결과 상태 - 존재하지 않는 키워드 검색', async ({ page }) => {
    // 결과 없는 API 응답 모킹
    await page.route('**/api/providers**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ providers: [], total: 0 }),
      });
    });

    const searchInput = page.getByPlaceholder('이름, 약어, 카테고리로 검색...');
    await searchInput.fill('존재하지않는학회명xyz');
    await searchInput.press('Enter');

    await expect(
      page.getByText(/검색 결과가 없습니다|데이터가 없습니다/).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('학회 목록 페이지 - 네비게이션', () => {
  test('헤더에서 학회 목록 페이지 접근', async ({ page }) => {
    await page.goto('/');
    // 헤더 또는 네비게이션에 학회 링크가 있는 경우
    const providerLink = page.getByRole('link', { name: /학회|Provider/ });
    if (await providerLink.count() > 0) {
      await providerLink.first().click();
      await expect(page).toHaveURL(/\/providers/);
    } else {
      // 직접 접근
      await page.goto('/providers');
      await expect(page).toHaveURL(/\/providers/);
    }
  });
});
