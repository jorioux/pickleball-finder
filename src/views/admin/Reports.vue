<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Location Reports</h1>

        <v-card v-if="reportsStore.isAdmin">
          <v-data-table
            :headers="headers"
            :items="reportsStore.reports"
            :loading="reportsStore.loading"
          >
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
              >
                {{ item.status }}
              </v-chip>
            </template>

            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="actions-grid">
                <v-btn
                  v-if="item.status === 'pending'"
                  size="small"
                  color="success"
                  @click="handleUpdateStatus(item.id, 'resolved')"
                  :loading="reportsStore.loading"
                >
                  <v-icon>mdi-check</v-icon>
                  <v-tooltip activator="parent">Mark as resolved</v-tooltip>
                </v-btn>
                
                <v-btn
                  v-if="item.status === 'pending'"
                  size="small"
                  color="warning"
                  @click="handleUpdateStatus(item.id, 'dismissed')"
                  :loading="reportsStore.loading"
                >
                  <v-icon>mdi-close</v-icon>
                  <v-tooltip activator="parent">Dismiss report</v-tooltip>
                </v-btn>

                <v-btn
                  size="small"
                  color="primary"
                  :to="`/locations/${item.locationId}`"
                  :loading="reportsStore.loading"
                >
                  <v-icon>mdi-map-marker</v-icon>
                  <v-tooltip activator="parent">View Location</v-tooltip>
                </v-btn>

                <v-btn
                  size="small"
                  color="error"
                  @click="handleDelete(item.id)"
                  :loading="reportsStore.loading"
                >
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent">Delete report</v-tooltip>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-alert
          v-else
          type="error"
          text="You don't have permission to view this page"
        ></v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { format } from 'date-fns'

const reportsStore = useReportsStore()

const headers = [
  { title: 'Location', key: 'locationName' },
  { title: 'Reporter', key: 'reporterEmail' },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status' },
  { title: 'Date', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'resolved':
      return 'success'
    case 'dismissed':
      return 'error'
    default:
      return 'grey'
  }
}

function formatDate(timestamp: any) {
  if (!timestamp?.toDate) return ''
  return format(timestamp.toDate(), 'PPpp')
}

async function handleUpdateStatus(reportId: string, status: 'resolved' | 'dismissed') {
  await reportsStore.updateReportStatus(reportId, status)
}

async function handleDelete(reportId: string) {
  if (confirm('Are you sure you want to delete this report?')) {
    await reportsStore.deleteReport(reportId)
  }
}

onMounted(async () => {
  if (reportsStore.isAdmin) {
    await reportsStore.fetchReports()
  }
})
</script>

<style scoped>
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  width: 120px;
  margin: 0 auto;
}
</style> 