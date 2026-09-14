"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

// Reads process.env.NEXT_PUBLIC_X literally (not through the shared `env`
// module) so Next's build-time inlining actually ships these into the
// browser bundle — see the comment in src/config/env.ts.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

let auth: Auth | undefined;
let connectedToEmulator = false;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }

  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulatorHost && !connectedToEmulator) {
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
    connectedToEmulator = true;
  }

  return auth;
}
