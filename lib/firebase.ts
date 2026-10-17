import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Only validate in production or when Firebase is actually needed
const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value && value !== "undefined")

if (!isFirebaseConfigured) {
  console.warn("⚠️ Firebase not configured. Using fallback mode.")
  console.log("🔧 To enable Firebase, add these environment variables:")
  console.log("   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key")
  console.log("   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain")
  console.log("   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id")
  console.log("   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket")
  console.log("   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id")
  console.log("   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id")
}

// Initialize Firebase only if configured
let app: any = null
let db: any = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    console.log("🔥 Firebase initialized with project:", firebaseConfig.projectId)
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error)
  }
}

export { db }
export default app
