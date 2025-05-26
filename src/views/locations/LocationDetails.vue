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
          <v-card-text>
            <p class="text-body-1 mb-4">{{ location?.description }}</p>
            
            <v-row>
              <v-col cols="12">
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
              <v-col cols="12">
                <div class="map-container">
                  <l-map
                    v-if="location?.coordinates"
                    :zoom="16"
                    :center="[location.coordinates.lat, location.coordinates.lng]"
                    :use-global-leaflet="false"
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
import 'leaflet/dist/leaflet.css'

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

// Compute if created and updated timestamps are the same
const isSameTimestamp = computed(() => {
  if (!location.value?.createdAt || !location.value?.updatedAt) return true
  return location.value.createdAt.seconds === location.value.updatedAt.seconds
})

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
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}

.details-section {
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  height: 100%;
}

.metadata-section {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.metadata-section .text-disabled {
  color: rgba(0, 0, 0, 0.38);
  margin-left: 4px;
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
}
</style> 