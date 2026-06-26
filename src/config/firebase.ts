import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './env';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (!getApps().length) {
      if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
        throw new Error(
          'Firebase belum dikonfigurasi. Pastikan .env berisi FIREBASE_API_KEY, FIREBASE_PROJECT_ID, dan FIREBASE_APP_ID.'
        );
      }
      app = initializeApp(FIREBASE_CONFIG);
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
