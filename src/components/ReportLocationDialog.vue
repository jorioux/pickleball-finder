<template>
  <v-dialog v-model="dialog" max-width="500">
    <template v-slot:activator="{ props }">
      <v-btn
        color="error"
        variant="tonal"
        v-bind="props"
        prepend-icon="mdi-flag"
        class="my-4"
      >
        Report Issue
      </v-btn>
    </template>

    <v-card>
      <v-card-title>Report Location Issue</v-card-title>
      
      <v-card-text>
        <p class="mb-4">Please describe what's wrong with this location:</p>
        
        <v-textarea
          v-model="reason"
          label="Reason"
          rows="4"
          :rules="[v => !!v || 'Reason is required']"
          :error-messages="error ? [error] : []"
          :loading="loading"
        ></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="dialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          :loading="loading"
          :disabled="!reason.trim()"
          @click="handleSubmit"
        >
          Submit Report
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useReportsStore } from '@/stores/reports'
import type { NewReport } from '@/types/report'

const props = defineProps<{
  locationId: string
  locationName: string
}>()

const dialog = ref(false)
const reason = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const reportsStore = useReportsStore()

async function handleSubmit() {
  if (!reason.value.trim()) return

  loading.value = true
  error.value = null

  try {
    await reportsStore.addReport({
      locationId: props.locationId,
      locationName: props.locationName,
      reason: reason.value.trim()
    } as NewReport)

    dialog.value = false
    reason.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script> 