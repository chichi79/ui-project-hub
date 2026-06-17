# UI Project Hub

UI 팀의 자체 프로젝트와 피드백을 모아보는 내부 허브입니다.

## 로컬 실행

```bash
cp .env.example .env.local
# .env.local 에 Firebase 설정 입력

npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. **Firestore Database** 생성 (테스트 모드 또는 프로덕션 규칙 설정)
3. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성** (JSON 다운로드)
4. `.env.local`에 JSON 내용을 한 줄로:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

첫 요청 시 컬렉션이 자동 생성되고 샘플 프로젝트 3개가 seed 됩니다.

### Firestore 보안 규칙 (참고)

서버는 Admin SDK를 사용하므로 클라이언트 직접 접근은 차단해도 됩니다:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Vercel 배포

1. GitHub에 push
2. [Vercel](https://vercel.com) → GitHub 저장소 Import
3. **Environment Variables** 추가:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` — 서비스 계정 JSON (한 줄)
   - `BLOB_READ_WRITE_TOKEN` — (선택) Vercel Blob Storage 연결 시
4. Deploy

## 기술 스택

- Next.js 15 + TypeScript + Tailwind CSS
- Firebase Firestore
- Vercel Blob (이미지, 프로덕션)
