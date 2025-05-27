<template>
  <v-card class="mb-4">
    <v-card-title>Upload Photos</v-card-title>
    <v-card-text>
      <!-- Upload section -->
      <v-file-input
        v-model="selectedFiles"
        label="Add Photos"
        multiple
        accept="image/*"
        :loading="loading"
        :disabled="loading"
        prepend-icon="mdi-camera"
        show-size
        counter
        :rules="[
          (v: File[] | null) => !v || !v.length || v.length <= 5 || 'Maximum 5 files allowed',
          (v: File[] | null) => !v || !v.length || !v.some(file => file.size > 1024 * 1024) || 'File size should not exceed 1MB'
        ]"
      ></v-file-input>

      <v-btn
        color="primary"
        :loading="loading"
        :disabled="!selectedFiles.length || loading"
        @click="uploadPhotos"
        class="mt-2"
      >
        Upload Photos
      </v-btn>
    </v-card-text>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLocationsStore } from '@/stores/locations'
import type { Location } from '@/stores/locations'

const props = defineProps<{
  location: Location
}>()

const emit = defineEmits<{
  (e: 'photos-updated'): void
}>()

const locationStore = useLocationsStore()
const selectedFiles = ref<File[]>([])
const loading = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

async function uploadPhotos() {
  if (!selectedFiles.value.length) return

  loading.value = true
  try {
    await locationStore.uploadLocationPhotos(props.location.id, selectedFiles.value)
    snackbar.value = {
      show: true,
      text: 'Photos uploaded successfully',
      color: 'success'
    }
    selectedFiles.value = []
    emit('photos-updated')
  } catch (error) {
    snackbar.value = {
      show: true,
      text: 'Error uploading photos',
      color: 'error'
    }
    console.error('Error uploading photos:', error)
  } finally {
    loading.value = false
  }
}
</script> 