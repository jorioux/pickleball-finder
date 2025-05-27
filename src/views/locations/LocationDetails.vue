<template>
  <v-container class="location-details-container">
    <!-- Back to Map Button -->
    <v-btn
      to="/"
      color="primary"
      class="mb-4"
      prepend-icon="mdi-map"
      variant="tonal"
    >
      Back to Map
    </v-btn>

    <v-row justify="center">
      <v-col cols="12">
        <v-card class="location-card">
          <v-card-title class="text-h4 mb-2">{{ location?.name }}</v-card-title>
          
          <!-- Photo Carousel -->
          <v-carousel
            v-if="location?.photos?.length"
            cycle
            height="400"
            hide-delimiter-background
            show-arrows="hover"
            class="mb-4"
            v-model="currentPhotoIndex"
          >
            <v-carousel-item
              v-for="(photo, i) in location.photos"
              :key="i"
              class="position-relative"
            >
              <v-img
                :src="photo.url"
                height="400"
                cover
              >
                <template v-slot:placeholder>
                  <v-row
                    class="fill-height ma-0"
                    align="center"
                    justify="center"
                  >
                    <v-progress-circular
                      indeterminate
                      color="primary"
                    ></v-progress-circular>
                  </v-row>
                </template>
              </v-img>

              <!-- Photo metadata and actions overlay -->
              <div class="photo-overlay">
                <div class="photo-info">
                  <span v-if="photoUploaders[photo.uploadedBy]">
                    Uploaded by {{ photoUploaders[photo.uploadedBy] }}
                    {{ formatDistanceToNow(photo.uploadedAt.toDate(), { addSuffix: true }) }}
                  </span>
                </div>
              </div>

              <!-- Delete button -->
              <v-btn
                v-if="auth.user && photo.uploadedBy === auth.user.uid"
                size="small"
                color="error"
                variant="tonal"
                @click.stop="confirmDeletePhoto(i)"
                class="delete-button"
              >
                <v-icon>mdi-delete</v-icon>
                <v-tooltip
                  activator="parent"
                  location="top"
                >
                  Delete photo
                </v-tooltip>
              </v-btn>
            </v-carousel-item>
          </v-carousel>

          <v-card-text>
            <p class="text-body-1 mb-4">{{ location?.description }}</p>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="details-section">
                  <h3 class="text-h6 mb-2">Location Details</h3>
                  <p class="mb-2"><strong>Address:</strong> {{ location?.address }}</p>
                  <p class="mb-2"><strong>Number of Courts:</strong> {{ location?.numberOfCourts }}</p>
                  <p class="mb-2"><strong>Surface Type:</strong> {{ location?.surfaceType }}</p>
                  <p class="mb-2"><strong>Indoor Facility:</strong> {{ location?.isIndoor ? 'Yes' : 'No' }}</p>
                  <p class="mb-2" v-if="creatorName"><strong>Created by:</strong> {{ creatorName }}</p>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <div class="metadata-section">
                    <p class="text-caption mb-1" v-if="location?.createdAt">
                      Created {{ formatDistanceToNow(location.createdAt.toDate(), { addSuffix: true }) }}
                      <span class="text-disabled">{{ format(location.createdAt.toDate(), 'PPpp') }}</span>
                    </p>
                    <p class="text-caption" v-if="location?.updatedAt && !isSameTimestamp">
                      Updated {{ formatDistanceToNow(location.updatedAt.toDate(), { addSuffix: true }) }}
                      <span class="text-disabled">{{ format(location.updatedAt.toDate(), 'PPpp') }}</span>
                    </p>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="map-container">
                  <l-map
                    v-if="location?.coordinates"
                    :zoom="16"
                    :center="[location.coordinates.lat, location.coordinates.lng]"
                    :use-global-leaflet="false"
                    ref="mapRef"
                  >
                    <l-tile-layer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      layer-type="base"
                      name="OpenStreetMap"
                    />
                    <l-marker
                      :lat-lng="[location.coordinates.lat, location.coordinates.lng]"
                    />
                  </l-map>
                  
                  <!-- Center map button -->
                  <v-btn
                    v-if="location?.coordinates"
                    color="primary"
                    size="small"
                    variant="tonal"
                    class="center-map-btn"
                    @click="centerMap"
                  >
                    <v-icon>mdi-crosshairs-gps</v-icon>
                    <v-tooltip
                      activator="parent"
                      location="left"
                    >
                      Center map on location
                    </v-tooltip>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Add Report Button for authenticated users -->
        <ReportLocationDialog
          v-if="auth.user && location"
          :location-id="location.id"
          :location-name="location.name"
        />

        <!-- Add Photo Upload Section -->
        <LocationPhotoUpload
          v-if="auth.user && location"
          :location="location"
          @photos-updated="refreshLocation"
        />

        <!-- Add Comments Section -->
        <LocationComments
          v-if="location"
          :location-id="location.id"
        />
      </v-col>
    </v-row>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/stores/auth'
import { useAuthStore } from '@/stores/auth'
import type { Location } from '@/stores/locations'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import { formatDistanceToNow, format } from 'date-fns'
import LocationComments from '@/components/LocationComments.vue'
import ReportLocationDialog from '@/components/ReportLocationDialog.vue'
import LocationPhotoUpload from '@/components/LocationPhotoUpload.vue'
import 'leaflet/dist/leaflet.css'
import { useLocationsStore } from '@/stores/locations'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const location = ref<Location | null>(null)
const creatorName = ref<string | null>(null)
const snackbar = ref({
  show: false,
  color: 'error',
  text: ''
})

const locationStore = useLocationsStore()
const currentPhotoIndex = ref(0)
const photoUploaders = ref<Record<string, string>>({})
const mapRef = ref<InstanceType<typeof LMap> | null>(null)

// Compute if created and updated timestamps are the same
const isSameTimestamp = computed(() => {
  if (!location.value?.createdAt || !location.value?.updatedAt) return true
  return location.value.createdAt.seconds === location.value.updatedAt.seconds
})

// Function to delete a photo
async function deletePhoto(index: number) {
  try {
    await locationStore.deleteLocationPhoto(location.value!.id, index)
    await refreshLocation()
    snackbar.value = {
      show: true,
      color: 'success',
      text: 'Photo deleted successfully'
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: (error as Error).message
    }
  }
}

// Function to fetch photo uploader names
async function fetchPhotoUploaders() {
  if (!location.value?.photos) return

  const uploaderIds = [...new Set(location.value.photos.map(photo => photo.uploadedBy))]
  
  for (const uploaderId of uploaderIds) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uploaderId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        photoUploaders.value[uploaderId] = userData.fullName || userData.displayName || 'Unknown User'
      }
    } catch (error) {
      console.error('Error fetching uploader info:', error)
      photoUploaders.value[uploaderId] = 'Unknown User'
    }
  }
}

// Function to refresh location data
async function refreshLocation() {
  try {
    const locationId = route.params.id as string
    const locationDoc = await getDoc(doc(db, 'locations', locationId))
    
    if (locationDoc.exists()) {
      location.value = {
        id: locationDoc.id,
        ...locationDoc.data()
      } as Location
      await fetchPhotoUploaders()
    }
  } catch (error) {
    console.error('Error refreshing location:', error)
  }
}

function centerMap() {
  if (location.value?.coordinates && mapRef.value?.leafletObject) {
    mapRef.value.leafletObject.setView(
      [location.value.coordinates.lat, location.value.coordinates.lng],
      16
    )
  }
}

// Function to handle photo deletion confirmation
async function confirmDeletePhoto(index: number) {
  if (!location.value?.photos?.[index]) return

  const confirmed = window.confirm('Are you sure you want to delete this photo?')
  if (!confirmed) return

  try {
    await locationStore.deleteLocationPhoto(location.value.id, index)
    await refreshLocation()
    snackbar.value = {
      show: true,
      color: 'success',
      text: 'Photo deleted successfully'
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: (error as Error).message
    }
  }
}

onMounted(async () => {
  try {
    const locationId = route.params.id as string
    const locationDoc = await getDoc(doc(db, 'locations', locationId))
    
    if (locationDoc.exists()) {
      location.value = {
        id: locationDoc.id,
        ...locationDoc.data()
      } as Location

      // Get creator info if available
      if (location.value.createdBy) {
        try {
          const userDoc = await getDoc(doc(db, 'users', location.value.createdBy))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            creatorName.value = userData.fullName || userData.displayName || 'Unknown User'
          } else {
            creatorName.value = 'Unknown User'
          }
        } catch (error) {
          console.error('Error fetching creator info:', error)
          creatorName.value = 'Unknown User'
        }
      }

      // Fetch photo uploader information
      await fetchPhotoUploaders()
    } else {
      snackbar.value = {
        show: true,
        color: 'error',
        text: 'Location not found'
      }
      router.push('/')
    }
  } catch (error) {
    console.error('Error fetching location:', error)
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error loading location details'
    }
  }
})
</script>

<style scoped>
.location-details-container {
  max-width: 1600px !important;
  padding: 16px;
}

.location-card {
  padding: 16px;
}

.map-container {
  height: 400px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

.details-section {
  padding: 24px;
  border-radius: 4px;
  height: 100%;
}

.metadata-section {
  font-size: 0.875rem;
}

.metadata-section .text-disabled {
  margin-left: 4px;
}

.position-relative {
  position: relative;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: white;
  z-index: 1;
}

.photo-info {
  font-size: 0.875rem;
}

.delete-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.6) !important;
}

.delete-button:hover {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

.center-map-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background-color: white !important;
}

@media (max-width: 600px) {
  .location-details-container {
    padding: 8px;
  }

  .location-card {
    padding: 8px;
  }

  .details-section {
    padding: 16px;
  }

  .metadata-section {
    font-size: 0.75rem;
  }

  .photo-info {
    font-size: 0.75rem;
  }
}
</style> 