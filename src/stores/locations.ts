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
  deleteDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore'
import { useAuthStore } from './auth'
import { db } from './auth'
import type { LocationData, PhotoData } from '@/types/location'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './auth'

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

  async function fetchLocationById(locationId: string) {
    loading.value = true
    error.value = null

    try {
      const locationRef = doc(db, 'locations', locationId)
      const locationSnap = await getDoc(locationRef)
      
      if (locationSnap.exists()) {
        return { id: locationSnap.id, ...locationSnap.data() }
      }
      return null
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error fetching location:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Helper function to upload a single file and get its URL
  async function uploadFile(file: File, path: string): Promise<string> {
    const fileRef = storageRef(storage, path)
    await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(fileRef)
    console.log('Generated download URL:', downloadURL) // Debug log
    return downloadURL
  }

  // Upload photos for a specific location
  async function uploadLocationPhotos(locationId: string, files: File[]) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to upload photos')
      }

      const locationRef = doc(db, 'locations', locationId)
      const locationSnap = await getDoc(locationRef)
      
      if (!locationSnap.exists()) {
        throw new Error('Location not found')
      }

      const location = locationSnap.data() as Location
      const existingPhotos = location.photos || []

      // Upload each file and get URLs
      const uploadPromises = files.map(async file => {
        const fileName = `${Date.now()}-${file.name}`
        const path = `locations/${locationId}/photos/${fileName}`
        const url = await uploadFile(file, path)
        
        const photoData: PhotoData = {
          url,
          uploadedBy: auth.user!.uid,
          uploadedAt: Timestamp.fromDate(new Date())
        }
        
        return photoData
      })

      const newPhotos = await Promise.all(uploadPromises)
      
      // Update location with new photo data
      await updateDoc(locationRef, {
        photos: [...existingPhotos, ...newPhotos],
        updatedAt: serverTimestamp()
      })

      // Refresh the locations
      await fetchUserLocations()
      return newPhotos
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error uploading photos:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // Delete a photo from a location
  async function deleteLocationPhoto(locationId: string, photoIndex: number) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to delete photos')
      }

      const locationRef = doc(db, 'locations', locationId)
      const locationSnap = await getDoc(locationRef)
      
      if (!locationSnap.exists()) {
        throw new Error('Location not found')
      }

      const location = locationSnap.data() as Location
      const photos = location.photos || []

      // Check if photo exists and user has permission
      if (!photos[photoIndex]) {
        throw new Error('Photo not found')
      }

      if (photos[photoIndex].uploadedBy !== auth.user.uid) {
        throw new Error('You can only delete your own photos')
      }

      // Remove the photo from the array
      const updatedPhotos = [...photos]
      updatedPhotos.splice(photoIndex, 1)

      // Update location with new photo array
      await updateDoc(locationRef, {
        photos: updatedPhotos,
        updatedAt: serverTimestamp()
      })

      // Refresh the locations
      await fetchUserLocations()
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error deleting photo:', e)
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
    deleteLocation,
    fetchLocationById,
    uploadFile,
    uploadLocationPhotos,
    deleteLocationPhoto
  }
}) 