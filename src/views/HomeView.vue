<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { ref, onMounted, computed } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import { useLocationsStore } from '@/stores/locations'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Ensure the center coordinates are always exactly two numbers
type MapCenter = [number, number]

const zoom = ref(12)
const center = ref<MapCenter>([47.6062, -122.3321]) // Default center (Seattle)
const locations = useLocationsStore()
const router = useRouter()
const auth = useAuthStore()
const isLocating = ref(false)
const locationError = ref<string | null>(null)
const map = ref<any>(null)

// Compute the map center as a tuple to ensure correct typing
const mapCenter = computed<MapCenter>(() => center.value)

const showError = computed({
  get: () => !!locationError.value,
  set: (value: boolean) => {
    if (!value) locationError.value = null
  }
})

const getUserLocation = () => {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    })
  })
}

const centerOnUserLocation = async () => {
  if (isLocating.value) return
  
  isLocating.value = true
  locationError.value = null

  try {
    const position = await getUserLocation()
    center.value = [position.coords.latitude, position.coords.longitude]
    zoom.value = 12

    // Force map to update its center
    if (map.value) {
      map.value.setView(center.value, zoom.value)
    }
  } catch (error) {
    console.error('Error getting location:', error)
    locationError.value = 'Could not get your location'
    
    // If we can't get user's location, center on the first location if available
    if (locations.allLocations.length > 0) {
      const firstLocation = locations.allLocations[0]
      center.value = [firstLocation.coordinates.lat, firstLocation.coordinates.lng]
      zoom.value = 13
    }
  } finally {
    isLocating.value = false
  }
}

onMounted(async () => {
  // First fetch all locations
  await locations.fetchAllLocations()
  
  // Then try to get user location
  await centerOnUserLocation()
})

const onMapReady = (mapInstance: any) => {
  map.value = mapInstance
}
</script>

<template>
  <div class="map-container">
    <v-progress-circular
      v-if="locations.loading"
      indeterminate
      color="primary"
      class="loading-indicator"
    ></v-progress-circular>

    <!-- Location Button -->
    <v-btn
      class="location-button"
      color="primary"
      size="large"
      :loading="isLocating"
      @click="centerOnUserLocation"
    >
      <v-icon icon="mdi-crosshairs-gps"></v-icon>
      <v-tooltip
        activator="parent"
        location="left"
      >
        Center on my location
      </v-tooltip>
    </v-btn>

    <!-- Location Error Snackbar -->
    <v-snackbar
      v-model="showError"
      color="error"
      :timeout="3000"
    >
      {{ locationError }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="locationError = null"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <l-map
      v-model="zoom"
      v-model:zoom="zoom"
      :center="mapCenter"
      :use-global-leaflet="false"
      @ready="onMapReady"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      />
      
      <template v-for="location in locations.allLocations" :key="location.id">
        <l-marker
          :lat-lng="[location.coordinates.lat, location.coordinates.lng]"
        >
          <l-popup>
            <div class="location-popup">
              <h3>{{ location.name }}</h3>
              <p class="mb-2">{{ location.description }}</p>
              <p class="mb-1"><strong>Courts:</strong> {{ location.numberOfCourts }}</p>
              <p class="mb-1"><strong>Surface:</strong> {{ location.surfaceType }}</p>
              <p class="mb-1"><strong>Indoor:</strong> {{ location.isIndoor ? 'Yes' : 'No' }}</p>
              <v-btn
                v-if="auth.user"
                color="primary"
                block
                class="mt-2"
                @click="router.push(`/locations/${location.id}`)"
              >
                View Details
              </v-btn>
              <v-btn
                v-else
                color="primary"
                block
                class="mt-2"
                @click="auth.signInWithGoogle"
              >
                Sign in to view details
              </v-btn>
            </div>
          </l-popup>
        </l-marker>
      </template>
    </l-map>
  </div>
</template>

<style scoped>
.map-container {
  position: absolute;
  top: 64px; /* Height of the navbar */
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100vh - 64px);
  width: 100vw;
}

:deep(.leaflet-container) {
  width: 100%;
  height: 100%;
}

:deep(.leaflet-control-attribution) {
  display: none !important;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
}

.location-button {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.location-popup {
  min-width: 200px;
  padding: 8px;
}

.location-popup h3 {
  margin-bottom: 8px;
  font-size: 1.1em;
  font-weight: 500;
}

.location-popup p {
  margin: 4px 0;
  font-size: 0.9em;
}
</style>
