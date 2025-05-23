<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Add a New Location</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-form ref="formRef" v-model="isValid" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Location Name"
            required
            variant="outlined"
            :rules="[v => !!v || 'Location name is required']"
          ></v-text-field>

          <v-textarea
            v-model="form.description"
            label="Description"
            variant="outlined"
            rows="3"
          ></v-textarea>

          <LocationPicker
            ref="locationPickerRef"
            v-model="locationData"
            class="mb-4"
          />

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.numberOfCourts"
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
                v-model="form.surfaceType"
                :items="surfaceTypes"
                label="Surface Type"
                variant="outlined"
                :rules="[v => !!v || 'Surface type is required']"
              ></v-select>
            </v-col>
          </v-row>

          <v-checkbox
            v-model="form.isIndoor"
            label="Indoor Facility"
          ></v-checkbox>

          <div class="d-flex justify-end mt-4">
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="locations.loading"
              :disabled="!isValid || locations.loading"
            >
              Add Location
            </v-btn>
          </div>
        </v-form>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationsStore } from '@/stores/locations'
import LocationPicker from '@/components/LocationPicker.vue'

const router = useRouter()
const locations = useLocationsStore()
const formRef = ref<any>(null)
const locationPickerRef = ref<any>(null)
const isValid = ref(false)

const surfaceTypes = [
  'Concrete',
  'Asphalt',
  'Sport Court',
  'Wood',
  'Other'
]

const form = ref({
  name: '',
  description: '',
  numberOfCourts: 1,
  surfaceType: '',
  isIndoor: false
})

const locationData = ref({
  address: '',
  coordinates: {
    lat: 0,
    lng: 0
  }
})

const snackbar = ref({
  show: false,
  color: 'success',
  text: ''
})

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  const hasValidLocation = locationPickerRef.value?.hasValidCoordinates
  
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
    await locations.addLocation({
      ...form.value,
      address: locationData.value.address,
      coordinates: locationData.value.coordinates
    })
    
    router.push('/locations/my')
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error creating location. Please try again.'
    }
  }
}
</script>

<style>
@import 'leaflet/dist/leaflet.css';
</style> 