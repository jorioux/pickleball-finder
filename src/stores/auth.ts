import { ref } from 'vue'
import { defineStore } from 'pinia'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { useRouter } from 'vue-router'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
// Initialize Firestore
export const db = getFirestore(app)

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const router = useRouter()

  // Initialize auth state listener
  onAuthStateChanged(auth, (newUser) => {
    user.value = newUser
    loading.value = false
  })

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      error.value = null
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error signing in with Google:', e)
    }
  }

  // Sign out
  async function signOut() {
    try {
      await firebaseSignOut(auth)
      error.value = null
      router.push({ name: 'home' })
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error signing out:', e)
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut
  }
}) 