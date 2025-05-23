<template>
  <v-container class="location-details-container">
    <v-row justify="center">
      <v-col cols="12" xl="10">
        <v-card class="location-card">
          <v-card-title class="text-h4 mb-2">{{ location?.name }}</v-card-title>
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
                </div>
              </v-col>
              <v-col cols="12" md="6">
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/stores/auth'
import type { Location } from '@/stores/locations'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const router = useRouter()
const location = ref<Location | null>(null)
const snackbar = ref({
  show: false,
  color: 'error',
  text: ''
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
}
</style> 