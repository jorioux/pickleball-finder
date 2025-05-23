import { ref } from 'vue'
import { defineStore } from 'pinia'
import { 
  collection, 
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { useAuthStore } from './auth'
import { db } from './auth'
import type { LocationData } from '@/types/location'

export interface Location extends LocationData {
  id: string
  createdAt: any // Firestore Timestamp
  updatedAt: any // Firestore Timestamp
  createdBy: string
}

export const useLocationsStore = defineStore('locations', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userLocations = ref<Location[]>([])
  const allLocations = ref<Location[]>([])
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

  async function fetchUserLocations() {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to fetch their locations')
      }

      const q = query(
        collection(db, 'locations'),
        where('createdBy', '==', auth.user.uid)
      )

      const querySnapshot = await getDocs(q)
      userLocations.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[]

    } catch (e) {
      error.value = (e as Error).message
      console.error('Error fetching user locations:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchAllLocations() {
    loading.value = true
    error.value = null

    try {
      const q = query(collection(db, 'locations'))
      const querySnapshot = await getDocs(q)
      allLocations.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[]
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error fetching all locations:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateLocation(locationId: string, updates: Partial<LocationData>) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to update a location')
      }

      const locationRef = doc(db, 'locations', locationId)
      await updateDoc(locationRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })

      // Refresh the locations list
      await fetchUserLocations()
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error updating location:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteLocation(locationId: string) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to delete a location')
      }

      await deleteDoc(doc(db, 'locations', locationId))
      
      // Remove from local state
      userLocations.value = userLocations.value.filter(loc => loc.id !== locationId)
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error deleting location:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    userLocations,
    allLocations,
    addLocation,
    fetchUserLocations,
    fetchAllLocations,
    updateLocation,
    deleteLocation
  }
}) 