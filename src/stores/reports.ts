import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './auth'
import { useAuthStore } from './auth'
import type { Report, NewReport } from '@/types/report'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref<Report[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = useAuthStore()

  const isAdmin = computed(() => auth.user?.email === 'riouxjo@gmail.com')

  async function fetchReports() {
    if (!isAdmin.value) {
      error.value = 'Unauthorized access'
      return
    }

    loading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      reports.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[]
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error fetching reports:', e)
    } finally {
      loading.value = false
    }
  }

  async function addReport(newReport: NewReport) {
    if (!auth.user) {
      throw new Error('Must be logged in to report a location')
    }

    loading.value = true
    error.value = null

    try {
      const reportData = {
        ...newReport,
        reportedBy: auth.user.uid,
        reporterEmail: auth.user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'reports'), reportData)
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error adding report:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
    if (!isAdmin.value) {
      error.value = 'Unauthorized access'
      return
    }

    loading.value = true
    error.value = null

    try {
      await updateDoc(doc(db, 'reports', reportId), { status })
      await fetchReports() // Refresh reports list
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error updating report:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteReport(reportId: string) {
    if (!isAdmin.value) {
      error.value = 'Unauthorized access'
      return
    }

    loading.value = true
    error.value = null

    try {
      await deleteDoc(doc(db, 'reports', reportId))
      await fetchReports() // Refresh reports list
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error deleting report:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    reports,
    loading,
    error,
    isAdmin,
    fetchReports,
    addReport,
    updateReportStatus,
    deleteReport
  }
}) 