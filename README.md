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
4. `.env.local`에 Firebase 설정 입력 (`.env.example` 참고)

**로컬과 프로덕션 DB 분리 (권장)**  
push로 코드를 배포해도 Firestore 데이터는 Git에 포함되지 않습니다. 다만 로컬과 Vercel이 **같은 Firebase 프로젝트·같은 DB**를 쓰면, 로컬에서 등록한 테스트 데이터가 프로덕션 사이트에도 그대로 보입니다.

- **방법 1 (권장):** Firebase Console → Firestore → **데이터베이스 추가** → 이름 `dev` 생성 후, 로컬 `.env.local`에만 `FIRESTORE_DATABASE_ID=dev` 설정. Vercel에는 설정하지 않음 (기본 DB 사용).
- **방법 2:** 로컬용·프로덕션용 Firebase 프로젝트를 각각 만들고 서비스 계정을 분리.

로컬에서 샘플 데이터가 필요할 때만 `.env.local`에 `SEED_SAMPLE_DATA=true`를 설정하세요. 프로덕션(Vercel)에서는 자동으로 비활성화됩니다.

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
   - `BLOB_READ_WRITE_TOKEN` — (권장) Vercel Blob Storage 연결 시
   - Firebase Storage — Blob 없을 때 이미지 저장용. [Firebase Console → Storage](https://console.firebase.google.com)에서 **시작하기**로 버킷 생성 (기본 버킷이면 추가 env 불필요)
   - `NEXT_PUBLIC_SITE_URL` — (권장) `https://ui-project-hub.vercel.app` 등 공유 미리보기용 도메인
4. Deploy

## 기술 스택

- Next.js 15 + TypeScript + Tailwind CSS
- Firebase Firestore
- Vercel Blob (이미지, 프로덕션)
