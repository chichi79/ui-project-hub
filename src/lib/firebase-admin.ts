import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

function initFirebase(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (jsonKey) {
    const serviceAccount = JSON.parse(jsonKey);
    app = initializeApp({ credential: cert(serviceAccount) });
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase 설정이 필요합니다. FIREBASE_SERVICE_ACCOUNT_KEY 또는 FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY를 설정하세요."
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  return databaseId
    ? getFirestore(initFirebase(), databaseId)
    : getFirestore(initFirebase());
}

export function isFirestoreNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 5
  );
}

export function firestoreSetupError(): Error {
  return new Error(
    "Firestore 데이터베이스가 없습니다. Firebase Console → Firestore Database → 데이터베이스 만들기에서 Native mode DB를 먼저 생성하세요. (리전: Seoul 또는 Tokyo)"
  );
}
