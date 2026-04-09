const BOT_PATTERN = /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|linkedinbot|slackbot/i;

const API_BASE = 'https://your-api.com'; // TODO: 백엔드 URL로 교체

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ua = request.headers.get('User-Agent') || '';
    const isBot = BOT_PATTERN.test(ua);

    if (isBot) {
      const segments = url.pathname.split('/').filter(Boolean);

      // 논문 상세 페이지 감지
      // /papers/:id  (2 segments)
      // /papers/:provider/:venue/:journal/:id  (5 segments)
      const isPaperDetail =
        segments[0] === 'papers' &&
        (segments.length === 2 || segments.length === 5);

      if (isPaperDetail) {
        const id = segments[segments.length - 1];
        try {
          const res = await fetch(`${API_BASE}/papers/${id}`);
          if (res.ok) {
            const paper = await res.json();
            const title = paper.title || '논문';
            const description = (paper.abstract || '').slice(0, 150).replace(/"/g, '&quot;');
            const authors = Array.isArray(paper.authors)
              ? paper.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')
              : '';

            return new Response(
              `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - 뉴논문</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url.href}" />
  ${authors ? `<meta name="author" content="${authors}" />` : ''}
</head>
<body>
  <h1>${title}</h1>
  ${authors ? `<p>${authors}</p>` : ''}
  ${paper.abstract ? `<p>${paper.abstract}</p>` : ''}
</body>
</html>`,
              { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
            );
          }
        } catch {
          // API 실패 시 Pages로 fallback
        }
      }
    }

    // 일반 유저 또는 봇 fallback → Cloudflare Pages 정적 파일
    const response = await env.ASSETS.fetch(request);

    // 파일 없으면 SPA용 index.html 반환 (_redirects 대체)
    if (response.status === 404) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return response;
  },
};
