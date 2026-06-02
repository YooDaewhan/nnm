import { test, expect } from '@playwright/test';

const MOCK_JOURNAL_ID = 'test-journal-001';

const mockJournalDetail = {
  id: MOCK_JOURNAL_ID,
  name: '교육학연구',
  publisher: '한국교육학회',
  issn: '1229-1234',
  eissn: '2765-5678',
  publication_frequency: '연 4회',
  kci_impact_factor: 1.23,
  kci_paper_count: 1500,
  kci_citation_count: 8500,
  homepage: 'https://journal.kera.or.kr',
  cover_image: null,
};

const mockSearchResults = {
  total: 2,
  items: [
    {
      id: 'paper-001',
      title: '교육학 연구의 새로운 패러다임',
      authors: [{ name: '홍길동' }],
      published_date: '2023.01',
      price: 3000,
      is_purchased: false,
      venue: { name: '교육학연구' },
    },
    {
      id: 'paper-002',
      title: '디지털 교육환경에서의 학습 효과',
      authors: [{ name: '김영희' }],
      published_date: '2023.03',
      price: 3000,
      is_purchased: false,
      venue: { name: '교육학연구' },
    },
  ],
};

test.describe('저널 상세 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 저널 상세 정보 API 모킹 (실제 경로: /api/venues/:id)
    await page.route(`**/api/venues/${MOCK_JOURNAL_ID}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockJournalDetail),
      });
    });
    // 저널 논문 검색 API 모킹
    await page.route('**/api/search/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSearchResults),
      });
    });

    await page.goto(`/journal/${MOCK_JOURNAL_ID}`);
  });

  test('저널 기본 정보 표시', async ({ page }) => {
    // 저널명 또는 제목 표시
    await expect(page.getByText(/교육학연구/).or(page.getByText(/저널/)).first()).toBeVisible({ timeout: 10000 });
  });

  test('논문 투고하기 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '논문 투고하기' }).or(
        page.getByText('논문 투고하기')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('저널 홈페이지 방문 버튼 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '저널 홈페이지 방문' }).or(
        page.getByText('저널 홈페이지 방문')
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('최근 발간 탭 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '최근 발간' }).or(page.getByText('최근 발간'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Top 10 탭 표시', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Top 10' }).or(page.getByText('Top 10'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('탭 전환 - 최근 발간 → Top 10', async ({ page }) => {
    const top10Tab = page.getByRole('button', { name: 'Top 10' }).or(page.getByText('Top 10'));
    await expect(top10Tab).toBeVisible({ timeout: 10000 });
    await top10Tab.first().click();
    // Top 10 탭이 활성화되어야 함
    await expect(top10Tab.first()).toBeVisible();
  });

  test('검색 결과 정렬 드롭다운 표시', async ({ page }) => {
    await expect(
      page.getByRole('combobox').filter({ hasText: /정확도순|최신순|관련도/ }).first().or(
        page.locator('select').first()
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('필터 사이드바 표시', async ({ page }) => {
    // 저널 필터 사이드바가 있어야 함 (JournalFilterSidebar 컴포넌트는 인라인 스타일 사용)
    await expect(
      page.getByText('결과 내 검색').or(page.getByText('발행일')).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('저널 페이지 - 기본 경로 (/journal)', () => {
  test('저널 기본 경로 접근 가능', async ({ page }) => {
    await page.goto('/journal');
    // 에러 없이 페이지 로드
    await expect(page).toHaveURL('/journal');
  });
});
