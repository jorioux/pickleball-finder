<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { ref, onMounted } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import type { LatLngTuple } from 'leaflet'

const zoom = ref(12)
const center = ref<LatLngTuple>([47.6062, -122.3321]) // Default center (Seattle)

onMounted(() => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        center.value = [position.coords.latitude, position.coords.longitude]
        zoom.value = 13
      },
      (error) => {
        console.error('Error getting location:', error)
      }
    )
  }
})
</script>

<template>
  <div class="map-container">
    <l-map
      v-model="zoom"
      v-model:zoom="zoom"
      :center="[center[0], center[1]]"
      :use-global-leaflet="false"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      />
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

</style>
