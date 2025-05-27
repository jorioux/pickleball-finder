<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useLocationsStore } from '@/stores/locations'
import { useAuthStore } from '@/stores/auth'
import imageCompression from 'browser-image-compression'
import type { ImageMetadata } from '@/types/location'
import { formatDistanceToNow, format } from 'date-fns'

const props = defineProps<{
  modelValue: boolean
  locationId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'images-updated'): void
}>()

const auth = useAuthStore()
const locationsStore = useLocationsStore()
const location = ref<any>(null)
const selectedFiles = ref<File[]>([])
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref('')
const showDeleteConfirm = ref(false)
const imageToDelete = ref<ImageMetadata | null>(null)

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
}

watch(() => props.modelValue, async (newVal) => {
  if (newVal && props.locationId) {
    await fetchLocationDetails()
  }
})

const fetchLocationDetails = async () => {
  if (!props.locationId) return
  try {
    const locationDoc = await locationsStore.fetchLocationById(props.locationId)
    if (locationDoc) {
      location.value = locationDoc
    }
  } catch (error) {
    console.error('Error fetching location:', error)
    errorMessage.value = 'Failed to load location details'
  }
}

const handleFileSelect = (files: File[]) => {
  selectedFiles.value = files
  errorMessage.value = ''
}

const compressImage = async (file: File): Promise<File> => {
  try {
    return await imageCompression(file, compressionOptions)
  } catch (error) {
    console.error('Error compressing image:', error)
    throw new Error('Failed to compress image')
  }
}

const uploadImages = async () => {
  if (!selectedFiles.value.length) return

  isUploading.value = true
  errorMessage.value = ''
  
  try {
    const compressedFiles: File[] = []
    
    // Compress all selected images
    for (const file of selectedFiles.value) {
      const compressedFile = await compressImage(file)
      compressedFiles.push(compressedFile)
    }
    
    // Upload compressed images
    await locationsStore.addPhotosToLocation(props.locationId!, compressedFiles)
    
    // Clear selection and refresh
    selectedFiles.value = []
    await fetchLocationDetails()
    emit('images-updated')
    
  } catch (error) {
    console.error('Error uploading images:', error)
    errorMessage.value = 'Failed to upload images. Please try again.'
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const confirmDelete = (image: ImageMetadata) => {
  imageToDelete.value = image
  showDeleteConfirm.value = true
}

const handleDelete = async () => {
  if (!imageToDelete.value || !props.locationId) return
  
  try {
    await locationsStore.deleteLocationImage(props.locationId, imageToDelete.value)
    await fetchLocationDetails()
    emit('images-updated')
  } catch (error) {
    console.error('Error deleting image:', error)
    errorMessage.value = 'Failed to delete image. Please try again.'
  } finally {
    showDeleteConfirm.value = false
    imageToDelete.value = null
  }
}

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'PPpp')
}

const canDeleteImage = (image: ImageMetadata): boolean => {
  if (!auth.user) return false
  return image.uploadedByUid === auth.user.uid
}

const closeDialog = () => {
  emit('update:modelValue', false)
  selectedFiles.value = []
  errorMessage.value = ''
  uploadProgress.value = 0
  showDeleteConfirm.value = false
  imageToDelete.value = null
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="closeDialog"
    max-width="800px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 pa-4">
        Manage Location Photos
      </v-card-title>

      <v-card-text>
        <!-- Error Message -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <!-- Upload Section -->
        <v-file-input
          v-model="selectedFiles"
          :loading="isUploading"
          :disabled="isUploading"
          accept="image/*"
          label="Add Photos"
          multiple
          prepend-icon="mdi-camera"
          show-size
          :rules="[
            (files) => !files?.length || files.length <= 5 || 'You can upload maximum 5 images at once',
            (files) => !files?.some(file => file.size > 5000000) || 'Each image must be less than 5MB'
          ]"
          hint="Select up to 5 images (max 5MB each). Images will be compressed before upload."
          persistent-hint
          @update:model-value="handleFileSelect"
        >
          <template v-slot:selection="{ fileNames }">
            <template v-for="fileName in fileNames" :key="fileName">
              <v-chip
                label
                size="small"
                color="primary"
                class="me-2"
              >
                {{ fileName }}
              </v-chip>
            </template>
          </template>
        </v-file-input>

        <v-btn
          v-if="selectedFiles.length"
          color="primary"
          class="mt-4"
          block
          :loading="isUploading"
          :disabled="isUploading"
          @click="uploadImages"
        >
          Upload Selected Photos
        </v-btn>

        <!-- Existing Photos -->
        <v-divider class="my-4"></v-divider>
        
        <div v-if="location?.imageUrls?.length" class="existing-photos">
          <h3 class="text-h6 mb-4">Existing Photos</h3>
          
          <v-row>
            <v-col
              v-for="(image, index) in location.imageUrls"
              :key="image.url"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card>
                <v-img
                  :src="image.url"
                  height="200"
                  cover
                  class="bg-grey-lighten-2"
                >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="grey-lighten-5"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>

                <v-card-text class="pt-2">
                  <div class="text-caption">
                    Uploaded by: {{ image.uploadedByName || 'Unknown' }}
                  </div>
                  <div class="text-caption">
                    {{ formatDate(image.uploadedAt) }}
                  </div>
                </v-card-text>

                <v-card-actions v-if="canDeleteImage(image)">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="error"
                    variant="text"
                    prepend-icon="mdi-delete"
                    @click="confirmDelete(image)"
                  >
                    Delete
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
        
        <v-alert
          v-else
          type="info"
          variant="tonal"
          class="mt-4"
        >
          No photos have been uploaded yet.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="closeDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteConfirm"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          Delete Photo?
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this photo? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<style scoped>
.existing-photos {
  margin-top: 1rem;
}
</style> 