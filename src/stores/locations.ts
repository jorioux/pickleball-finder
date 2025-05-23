import { ref } from 'vue'
import { defineStore } from 'pinia'
import { 
  collection, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from './auth'
import { db } from './auth'
import type { LocationData } from '@/types/location'

export const useLocationsStore = defineStore('locations', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = useAuthStore()

  async function addLocation(locationData: LocationData) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to add a location')
      }

      const locationWithMetadata = {
        ...locationData,
        createdBy: auth.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'locations'), locationWithMetadata)
      return docRef.id
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error adding location:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    addLocation
  }
}) 