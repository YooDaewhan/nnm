import { test, expect } from '@playwright/test';

const MOCK_PAPER_ID = 'test-paper-001';

const mockPaperResponse = {
  id: MOCK_PAPER_ID,
  title: '교육학 연구방법론의 최신 동향',
  title_en: 'Recent Trends in Educational Research Methodology',
  abstract: '본 논문은 교육학 연구방법론의 최신 동향을 체계적으로 분석하고 향후 방향을 제시합니다.',
  abstract_en: 'This paper systematically analyzes recent trends in educational research methodology.',
  authors: [
    { name: '홍길동', email: 'test@test.com', affiliation: '서울대학교', orcid: '' },
    { name: '김철수', email: '', affiliation: '연세대학교', orcid: '' },
  ],
  published_date: '2023.05',
  doi: '10.12345/test.2023.001',
  price: 3000,
  is_purchased: false,
  paper_type: '학술논문',
  is_kci: true,
  keywords: ['교육학', '연구방법론', '질적연구'],
  keywords_en: ['Education', 'Research Methodology'],
  venue: {
    name: '교육학연구',
    provider: '한국교육학회',
    volume: '61',
    issue: '3',
    start_page: '1',
    end_page: '25',
  },
};

test.describe('논문 상세 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 논문 API 모킹
    await page.route(`**/${MOCK_PAPER_ID}**`, async (route) => {
      const url = route.request().url();
      if (url.includes('papers') || url.includes('api')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPaperResponse),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/papers/${MOCK_PAPER_ID}`);
  });

  test('논문 제목 표시', async ({ page }) => {
    await expect(page.getByText('교육학 연구방법론의 최신 동향')).toBeVisible({ timeout: 10000 });
  });

  test('저자 이름 표시', async ({ page }) => {
    await expect(page.getByText(/홍길동/)).toBeVisible({ timeout: 10000 });
  });

  test('초록 섹션 표시', async ({ page }) => {
    await expect(page.getByText(/초록/).or(page.getByText(/Abstract/))).toBeVisible({ timeout: 10000 });
  });

  test('인용하기 버튼 표시 및 클릭 시 모달 열림', async ({ page }) => {
    const citeBtn = page.getByRole('button', { name: '인용하기' });
    await expect(citeBtn).toBeVisible({ timeout: 10000 });
    await citeBtn.click();
    // 인용 모달 내용 확인 (APA, MLA, Chicago 등)
    await expect(
      page.getByText(/APA|MLA|Chicago|인용/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('미리보기 버튼 표시', async ({ page }) => {
    await expect(page.getByRole('button', { name: '미리보기' })).toBeVisible({ timeout: 10000 });
  });

  test('구매하기 또는 원문보기 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /구매하기|원문보기|무료보기/ }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('스크랩 버튼 표시', async ({ page }) => {
    // 스크랩(하트/북마크) 버튼 확인
    const scrapBtn = page.locator('button[title*="스크랩"], button[aria-label*="스크랩"]').or(
      page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    );
    await expect(scrapBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('장바구니 버튼 표시', async ({ page }) => {
    const cartBtn = page.locator('button[title*="장바구니"], button[aria-label*="장바구니"]').or(
      page.locator('button').filter({ has: page.locator('svg') }).nth(2)
    );
    await expect(cartBtn.first()).toBeVisible({ timeout: 10000 });
  });

  test('키워드 표시', async ({ page }) => {
    await expect(page.getByText(/키워드/).or(page.getByText(/Keywords/))).toBeVisible({ timeout: 10000 });
  });

  test('공유 버튼 클릭 시 링크 복사 피드백', async ({ page }) => {
    // 공유 버튼 (첫 번째 아이콘 버튼)
    const shareBtn = page.locator('button[title*="공유"], button[aria-label*="공유"]');
    if (await shareBtn.count() > 0) {
      await shareBtn.first().click();
      // 복사 완료 툴팁 또는 메시지 표시
      await expect(
        page.getByText(/복사|공유|Copied/).first()
      ).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('논문 상세 페이지 - 구매된 논문', () => {
  test.beforeEach(async ({ page }) => {
    const purchasedPaper = { ...mockPaperResponse, is_purchased: true };

    await page.route(`**/${MOCK_PAPER_ID}**`, async (route) => {
      const url = route.request().url();
      if (url.includes('papers') || url.includes('api')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(purchasedPaper),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/papers/${MOCK_PAPER_ID}`);
  });

  test('구매된 논문 - 다운로드 버튼 또는 원문보기 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /다운로드|원문보기/ }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('논문 상세 페이지 - 오류 상태', () => {
  test('존재하지 않는 논문 접근 시 오류 표시', async ({ page }) => {
    await page.route('**/papers/not-found-paper**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: '논문을 찾을 수 없습니다.' }),
      });
    });

    await page.goto('/papers/not-found-paper');
    // 오류 메시지 또는 빈 상태 표시
    await expect(
      page.getByText(/찾을 수 없|오류|Not Found|404/).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
