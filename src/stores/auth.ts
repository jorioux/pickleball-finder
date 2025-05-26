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
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
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
  const snackbar = ref({
    show: false,
    text: '',
    color: 'success'
  })

  // Initialize auth state listener
  onAuthStateChanged(auth, (newUser) => {
    user.value = newUser
    loading.value = false
  })

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Save user profile data
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid)
        const userData = {
          displayName: result.user.displayName,
          email: result.user.email,
          fullName: result.user.displayName, // Use display name as full name initially
          photoURL: result.user.photoURL,
          lastSignIn: new Date()
        }
        await setDoc(userRef, userData, { merge: true })
      }
      
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
      snackbar.value = {
        show: true,
        text: 'You have been signed out',
        color: 'success'
      }
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error signing out:', e)
      snackbar.value = {
        show: true,
        text: 'Error signing out. Please try again.',
        color: 'error'
      }
    }
  }

  return {
    user,
    loading,
    error,
    snackbar,
    signInWithGoogle,
    signOut
  }
}) 