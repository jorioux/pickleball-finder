<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">My Locations</h1>
      </v-col>
    </v-row>

    <v-row v-if="locations.loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <template v-else>
      <v-row v-if="locations.userLocations.length === 0">
        <v-col cols="12">
          <v-alert type="info" variant="tonal">
            You haven't added any locations yet.
            <v-btn
              color="primary"
              variant="text"
              to="/locations/create"
              class="ml-2"
            >
              Add your first location
            </v-btn>
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          v-for="location in locations.userLocations"
          :key="location.id"
          cols="12"
        >
          <v-card width="100%">
            <v-card-title>{{ location.name }}</v-card-title>
            <v-card-text>
              <p class="mb-2">{{ location.description }}</p>
              <p class="mb-1"><strong>Address:</strong> {{ location.address }}</p>
              <p class="mb-1"><strong>Courts:</strong> {{ location.numberOfCourts }}</p>
              <p class="mb-1"><strong>Surface:</strong> {{ location.surfaceType }}</p>
              <p class="mb-3"><strong>Indoor:</strong> {{ location.isIndoor ? 'Yes' : 'No' }}</p>

              <div class="location-map">
                <l-map
                  :zoom="15"
                  :center="getCoordinates(location)"
                  :use-global-leaflet="false"
                >
                  <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
                  />
                  <l-marker
                    v-if="hasValidCoordinates(location)"
                    :lat-lng="getCoordinates(location)"
                  />
                </l-map>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="text"
                @click="editLocation(location)"
              >
                Edit
              </v-btn>
              <v-btn
                color="error"
                variant="text"
                @click="confirmDelete(location)"
              >
                Delete
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog.show" max-width="600px">
      <v-card>
        <v-card-title>Edit Location</v-card-title>
        <v-card-text>
          <v-form ref="editFormRef" v-model="editDialog.isValid" class="mt-4">
            <v-text-field
              v-model="editDialog.form.name"
              label="Location Name"
              required
              variant="outlined"
              :rules="[v => !!v || 'Location name is required']"
            ></v-text-field>

            <v-textarea
              v-model="editDialog.form.description"
              label="Description"
              variant="outlined"
              rows="3"
            ></v-textarea>

            <LocationPicker
              ref="editLocationPickerRef"
              v-model="editDialog.locationData"
              class="mb-4"
            />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editDialog.form.numberOfCourts"
                  label="Number of Courts"
                  type="number"
                  variant="outlined"
                  min="1"
                  :rules="[
                    v => !!v || 'Number of courts is required',
                    v => v >= 1 || 'Must have at least 1 court'
                  ]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editDialog.form.surfaceType"
                  :items="surfaceTypes"
                  label="Surface Type"
                  variant="outlined"
                  :rules="[v => !!v || 'Surface type is required']"
                ></v-select>
              </v-col>
            </v-row>

            <v-checkbox
              v-model="editDialog.form.isIndoor"
              label="Indoor Facility"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="editDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="handleEditSubmit"
            :loading="locations.loading"
            :disabled="locations.loading"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Delete Location</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteDialog.locationName }}"? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="handleDeleteConfirm"
            :loading="locations.loading"
            :disabled="locations.loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
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
import { useLocationsStore } from '@/stores/locations'
import type { Location } from '@/stores/locations'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import LocationPicker from '@/components/LocationPicker.vue'

const locations = useLocationsStore()
const editFormRef = ref<any>(null)
const editLocationPickerRef = ref<any>(null)

const surfaceTypes = [
  'Concrete',
  'Asphalt',
  'Sport Court',
  'Wood',
  'Other'
]

// Default coordinates (Seattle)
const DEFAULT_COORDINATES: [number, number] = [47.6062, -122.3321]

const getCoordinates = (location: Location): [number, number] => {
  if (!location?.coordinates?.lat || !location?.coordinates?.lng || 
      isNaN(location.coordinates.lat) || isNaN(location.coordinates.lng)) {
    return DEFAULT_COORDINATES
  }
  return [location.coordinates.lat, location.coordinates.lng]
}

const hasValidCoordinates = (location: Location): boolean => {
  return !!(location?.coordinates?.lat && location?.coordinates?.lng && 
    !isNaN(location.coordinates.lat) && !isNaN(location.coordinates.lng))
}

const editDialog = ref({
  show: false,
  isValid: false,
  locationId: '',
  form: {
    name: '',
    description: '',
    numberOfCourts: 1,
    surfaceType: '',
    isIndoor: false
  },
  locationData: {
    address: '',
    coordinates: {
      lat: 0,
      lng: 0
    }
  }
})

const deleteDialog = ref({
  show: false,
  locationId: '',
  locationName: ''
})

const snackbar = ref({
  show: false,
  color: 'success',
  text: ''
})

onMounted(async () => {
  await locations.fetchUserLocations()
})

const editLocation = (location: Location) => {
  editDialog.value = {
    show: true,
    isValid: false,
    locationId: location.id,
    form: {
      name: location.name,
      description: location.description,
      numberOfCourts: location.numberOfCourts,
      surfaceType: location.surfaceType,
      isIndoor: location.isIndoor
    },
    locationData: {
      address: location.address || '',
      coordinates: location.coordinates || { lat: 0, lng: 0 }
    }
  }
}

const handleEditSubmit = async () => {
  const { valid } = await editFormRef.value?.validate()
  const hasValidLocation = editLocationPickerRef.value?.hasValidCoordinates
  
  if (!valid || !hasValidLocation) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: !valid 
        ? 'Please fill in all required fields'
        : 'Please select a valid location on the map'
    }
    return
  }

  try {
    await locations.updateLocation(editDialog.value.locationId, {
      ...editDialog.value.form,
      address: editDialog.value.locationData.address,
      coordinates: editDialog.value.locationData.coordinates
    })
    editDialog.value.show = false
    snackbar.value = {
      show: true,
      color: 'success',
      text: 'Location updated successfully!'
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error updating location. Please try again.'
    }
  }
}

const confirmDelete = (location: Location) => {
  deleteDialog.value = {
    show: true,
    locationId: location.id,
    locationName: location.name
  }
}

const handleDeleteConfirm = async () => {
  try {
    await locations.deleteLocation(deleteDialog.value.locationId)
    deleteDialog.value.show = false
    snackbar.value = {
      show: true,
      color: 'success',
      text: 'Location deleted successfully!'
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error deleting location. Please try again.'
    }
  }
}
</script>

<style>
@import 'leaflet/dist/leaflet.css';

.location-map {
  height: 200px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 16px;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}
</style> 