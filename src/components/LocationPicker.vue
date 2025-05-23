<template>
  <div>
    <div class="d-flex align-center mb-4">
      <v-text-field
        v-model="addressInput"
        label="Address"
        required
        variant="outlined"
        :rules="[v => !!v || 'Address is required']"
        @update:model-value="debouncedGeocodeAddress"
        class="flex-grow-1"
      ></v-text-field>
      <v-btn
        :loading="isGeocoding"
        :disabled="!addressInput"
        color="primary"
        class="ml-2"
        @click="geocodeAddress"
      >
        Search
      </v-btn>
    </div>

    <div class="location-map" ref="mapContainer">
      <l-map
        v-if="isMapReady"
        :zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
        @ready="onMapReady"
        @click="handleMapClick"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        />
        <l-marker
          v-if="markerPosition"
          :lat-lng="markerPosition"
          draggable
          @dragend="handleMarkerDragend"
        />
      </l-map>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import type { LatLngTuple, LeafletMouseEvent } from 'leaflet'
import debounce from 'lodash/debounce'

interface Props {
  modelValue: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
}

const DEFAULT_CENTER: LatLngTuple = [47.6062, -122.3321] // Seattle
const DEFAULT_ZOOM = 13

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const zoom = ref(DEFAULT_ZOOM)
const center = ref<LatLngTuple>(DEFAULT_CENTER)
const markerPosition = ref<LatLngTuple | null>(null)
const addressInput = ref(props.modelValue.address)
const isGeocoding = ref(false)
const hasValidCoordinates = ref(false)
const isMapReady = ref(false)
const map = ref<any>(null)

// Initialize marker if coordinates exist and are valid
const initializeWithCoordinates = () => {
  if (props.modelValue.coordinates && 
      typeof props.modelValue.coordinates.lat === 'number' && 
      typeof props.modelValue.coordinates.lng === 'number' &&
      !isNaN(props.modelValue.coordinates.lat) && 
      !isNaN(props.modelValue.coordinates.lng)) {
    const pos: LatLngTuple = [props.modelValue.coordinates.lat, props.modelValue.coordinates.lng]
    markerPosition.value = pos
    center.value = pos
    hasValidCoordinates.value = true
    zoom.value = 16
  }
}

onMounted(() => {
  isMapReady.value = true
  initializeWithCoordinates()
})

const onMapReady = (mapInstance: any) => {
  map.value = mapInstance
  // Force a map refresh after initialization
  setTimeout(() => {
    map.value?.invalidateSize()
  }, 100)
}

// Watch for external address changes
watch(() => props.modelValue.address, (newAddress) => {
  if (newAddress !== addressInput.value) {
    addressInput.value = newAddress
  }
})

// Watch for external coordinate changes
watch(() => props.modelValue.coordinates, (newCoords) => {
  if (newCoords && 
      typeof newCoords.lat === 'number' && 
      typeof newCoords.lng === 'number' &&
      !isNaN(newCoords.lat) && 
      !isNaN(newCoords.lng)) {
    const pos: LatLngTuple = [newCoords.lat, newCoords.lng]
    markerPosition.value = pos
    center.value = pos
    hasValidCoordinates.value = true
    zoom.value = 16
    
    // Force map update
    if (map.value) {
      map.value.invalidateSize()
    }
  } else {
    hasValidCoordinates.value = false
  }
}, { deep: true })

const geocodeAddress = async () => {
  if (!addressInput.value) return

  isGeocoding.value = true
  hasValidCoordinates.value = false
  
  try {
    const encodedAddress = encodeURIComponent(addressInput.value)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`)
    const data = await response.json()

    if (data && data[0]) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const newPos: LatLngTuple = [lat, lng]
        markerPosition.value = newPos
        center.value = newPos
        zoom.value = 16
        hasValidCoordinates.value = true

        emit('update:modelValue', {
          address: addressInput.value,
          coordinates: { lat, lng }
        })

        // Force map update
        if (map.value) {
          map.value.invalidateSize()
        }
      }
    }
  } catch (error) {
    console.error('Error geocoding address:', error)
  } finally {
    isGeocoding.value = false
  }
}

const debouncedGeocodeAddress = debounce(geocodeAddress, 1000)

const handleMapClick = (event: LeafletMouseEvent) => {
  const { lat, lng } = event.latlng
  if (!isNaN(lat) && !isNaN(lng)) {
    markerPosition.value = [lat, lng]
    hasValidCoordinates.value = true
    emit('update:modelValue', {
      address: addressInput.value,
      coordinates: { lat, lng }
    })
  }
}

const handleMarkerDragend = (event: any) => {
  const { lat, lng } = event.target.getLatLng()
  if (!isNaN(lat) && !isNaN(lng)) {
    markerPosition.value = [lat, lng]
    hasValidCoordinates.value = true
    emit('update:modelValue', {
      address: addressInput.value,
      coordinates: { lat, lng }
    })
  }
}

defineExpose({
  hasValidCoordinates
})
</script>

<style scoped>
.location-map {
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
</style> 