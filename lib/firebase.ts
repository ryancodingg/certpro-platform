import { getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
// v0 can import env values with literal newline/quote wrappers.
export function cleanPublicConfig(value: string | undefined) { return value?.trim().replace(/\\[nr]/g, '').replace(/^["']|["']$/g, '').trim() }
const app = getApps()[0] ?? initializeApp({
  // Keep static generation from evaluating Firebase with an undefined config; sign-in still fails clearly until project vars are configured.
  apiKey: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ?? "build-placeholder",
  authDomain: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanPublicConfig(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
})
export const auth = getAuth(app)
export default app
