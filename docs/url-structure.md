# URL 구조 변경 및 SEO 전략

## 변경 전 → 변경 후

### 논문 상세 페이지

| 구분 | 변경 전 | 변경 후 |
|------|---------|---------|
| provider/venue/journal 있을 때 | `/papers/한국교육학회/사회과교육연구/학술지?id=019d66ca` | `/papers/한국교육학회/사회과교육연구/학술지/019d66ca` |
| 없을 때 | `/papers?id=019d66ca` | `/papers/019d66ca` |

---

## 왜 바꿨나

### 쿼리스트링(`?id=`)의 문제

1. **구글 봇이 독립 페이지로 인식 못 함**  
   `/papers?id=A`와 `/papers?id=B`는 경로가 같아 같은 페이지의 변형으로 취급될 수 있음

2. **URL에 의미있는 정보가 없음**  
   경로 기반 URL은 논문이 어느 학회/저널 소속인지 URL만 봐도 알 수 있어 SEO 신호가 됨

3. **SPA라 HTML이 빈 껍데기**  
   리액트는 JS가 실행된 후 내용이 채워지므로 봇이 크롤링할 때 내용을 못 읽음  
   → Cloudflare Worker로 해결 (아래 참고)

---

## 현재 라우터 구조

```
/papers/:id                              ← 논문 상세 (provider 정보 없을 때)
/papers/:provider/:venue/:journal/:id   ← 논문 상세 (전체 경로)
```

---

## Cloudflare Pages + Worker 구조

```
봇 (Googlebot 등)
  └─ /papers/* 접근
       └─ _worker.js 감지
            └─ 백엔드 API 호출 → 완성된 HTML 반환 (SEO용)

일반 유저
  └─ 어떤 경로든 접근
       └─ _worker.js 통과
            └─ Cloudflare Pages → index.html 반환  
                 └─ 리액트 라우터가 URL 읽어서 렌더링
```

### `public/_redirects`

SPA에서 경로 직접 접근(새로고침, 링크 공유) 시 404가 나는 문제를 해결:

```
/* /index.html 200
```

---

## 배포 시 주의사항

### `_worker.js` 백엔드 URL 설정

`_worker.js` 파일의 상단 `API_BASE`를 실제 백엔드 주소로 교체:

```js
const API_BASE = 'https://your-api.com'; // ← 여기 교체
```

### 빌드 시 자동 복사

`npm run build` 실행 시 `_worker.js`가 자동으로 `dist/`에 복사됨  
Cloudflare Pages는 빌드 output(`dist/`) 루트의 `_worker.js`를 자동 인식함

---

## Worker가 처리하는 봇 목록

- Googlebot
- Bingbot
- Yandex
- Baiduspider
- Twitterbot
- Facebookexternalhit
- LinkedInBot
- Slackbot
