# UI Project Hub

UI 팀의 자체 프로젝트와 피드백을 모아보는 내부 허브입니다.

## 로컬 실행

```bash
cp .env.example .env.local
# .env.local 에 DATABASE_URL 입력 (Neon Postgres)

npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## Vercel 배포

1. [GitHub](https://github.com/new)에 새 저장소 생성
2. 이 프로젝트 push
3. [Vercel](https://vercel.com) → **Add New Project** → GitHub 저장소 연결
4. Vercel 프로젝트에서 **Storage** 추가:
   - **Neon Postgres** → `DATABASE_URL` 자동 연결
   - **Blob** → `BLOB_READ_WRITE_TOKEN` 자동 연결
5. Deploy

첫 요청 시 DB 테이블이 자동 생성되고 샘플 프로젝트 3개가 seed 됩니다.

## 기술 스택

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Neon Postgres (서버리스)
- Vercel Blob (이미지 업로드, 프로덕션)
