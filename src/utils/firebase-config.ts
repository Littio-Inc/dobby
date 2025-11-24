import { initializeApp, getApps, type App } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

let app: App | undefined;
let auth: Auth | undefined;

export const initializeFirebase = () => {
  console.log('[Firebase] Initializing Firebase app...');
  console.log('[Firebase] Config:', {
    apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });

  if (getApps().length === 0) {
    console.log('[Firebase] No existing apps, creating new app');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('[Firebase] Using existing app');
    app = getApps()[0];
  }

  auth = getAuth(app);
  console.log('[Firebase] Auth instance created');
  return { app, auth };
};

export const getFirebaseAuth = () => {
  if (!auth) {
    console.log('[Firebase] Auth not initialized, initializing now...');
    const result = initializeFirebase();
    auth = result.auth;
  }
  if (!auth) {
    console.error('[Firebase] Auth initialization failed!');
    throw new Error('Firebase Auth no se pudo inicializar. Verifica las variables de entorno.');
  }
  console.log('[Firebase] Returning auth instance');
  return auth;
};

export const googleProvider = new GoogleAuthProvider();
// Restrict to specific domain
googleProvider.setCustomParameters({
  hd: 'littio.co', // Hosted domain - solo emails @littio.co
});
