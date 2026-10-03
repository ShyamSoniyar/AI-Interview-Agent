import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Tolerate values pasted straight out of the JSON key file (stray quotes / trailing comma)
const clean = (v) => v?.trim().replace(/,$/, "").replace(/^["']|["']$/g, "");

// Service account values come from the Firebase console:
// Project Settings -> Service Accounts -> Generate new private key
const projectId = clean(process.env.FIREBASE_PROJECT_ID);
const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
// .env stores the key with literal \n sequences; restore real newlines
const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");

export const firebaseReady = Boolean(projectId && clientEmail && privateKey);

if (firebaseReady && !getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
} else if (!firebaseReady) {
  console.error(
    "[firebase-admin] Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. " +
      "Google sign-in will be rejected until these are set.",
  );
}

export const firebaseAuth = () => getAuth();
