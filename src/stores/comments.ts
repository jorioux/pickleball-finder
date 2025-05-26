import { ref } from 'vue'
import { defineStore } from 'pinia'
import { 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore'
import { db } from './auth'
import { useAuthStore } from './auth'
import type { Comment, NewComment } from '@/types/comment'

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = useAuthStore()

  async function fetchComments(locationId: string) {
    loading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'comments'),
        where('locationId', '==', locationId),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      comments.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[]
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error fetching comments:', e)
    } finally {
      loading.value = false
    }
  }

  async function addComment(locationId: string, newComment: NewComment) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to add a comment')
      }

      const commentData = {
        locationId,
        userId: auth.user.uid,
        userDisplayName: auth.user.displayName || 'Anonymous',
        text: newComment.text,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'comments'), commentData)
      await fetchComments(locationId) // Refresh comments
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error adding comment:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteComment(commentId: string, locationId: string) {
    loading.value = true
    error.value = null

    try {
      if (!auth.user) {
        throw new Error('User must be authenticated to delete a comment')
      }

      await deleteDoc(doc(db, 'comments', commentId))
      await fetchComments(locationId) // Refresh comments
    } catch (e) {
      error.value = (e as Error).message
      console.error('Error deleting comment:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment
  }
}) 