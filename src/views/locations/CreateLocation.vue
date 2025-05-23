<template>
  <v-row class="mt-4" v-if="auth.user">
    <v-col cols="12">
      <v-card>
        <v-card-title class="text-h5">
          Add a Pickleball Location
        </v-card-title>
        <v-card-text>
          <v-form
            class="mt-4"
            ref="formRef"
            v-model="isFormValid"
          >
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

            <v-text-field
              v-model="form.address"
              label="Address"
              required
              variant="outlined"
              :rules="[v => !!v || 'Address is required']"
            ></v-text-field>

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
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="handleSubmit"
            :loading="locations.loading"
            :disabled="locations.loading"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
  <v-row v-else class="mt-4">
    <v-col cols="12">
      <v-card>
        <v-card-text class="text-center">
          <p class="text-h6 mb-4">Please sign in to add a new location</p>
          <v-btn
            color="primary"
            prepend-icon="mdi-google"
            @click="auth.signInWithGoogle"
          >
            Sign in with Google
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Success/Error Snackbar -->
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocationsStore } from '@/stores/locations'
import type { LocationData } from '@/types/location'

const router = useRouter()
const auth = useAuthStore()
const locations = useLocationsStore()
const formRef = ref<any>(null)
const isFormValid = ref(false)

const form = ref<LocationData>({
  name: '',
  description: '',
  address: '',
  numberOfCourts: 1,
  surfaceType: '',
  isIndoor: false
})

const snackbar = ref({
  show: false,
  color: 'success',
  text: ''
})

onMounted(() => {
  // Double-check authentication status
  if (!auth.user) {
    router.push({ name: 'home' })
  }
})

const surfaceTypes = [
  'Concrete',
  'Asphalt',
  'Sport Court',
  'Wood',
  'Other'
]

const handleSubmit = async () => {
  if (!auth.user) {
    router.push({ name: 'home' })
    return
  }

  const { valid } = await formRef.value?.validate()
  
  if (!valid) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Please fill in all required fields correctly'
    }
    return
  }

  try {
    await locations.addLocation(form.value)
    snackbar.value = {
      show: true,
      color: 'success',
      text: 'Location added successfully!'
    }
    
    // Reset form
    form.value = {
      name: '',
      description: '',
      address: '',
      numberOfCourts: 1,
      surfaceType: '',
      isIndoor: false
    }
    formRef.value?.reset()
    
    // Navigate to home page after successful submission
    router.push({ name: 'home' })
  } catch (error) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: 'Error adding location. Please try again.'
    }
  }
}
</script> 