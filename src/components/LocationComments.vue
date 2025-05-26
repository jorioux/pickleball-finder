<!-- LocationComments.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { formatDistanceToNow } from 'date-fns'
import type { NewComment } from '@/types/comment'

const props = defineProps<{
  locationId: string
}>()

const commentsStore = useCommentsStore()
const authStore = useAuthStore()
const newCommentText = ref('')

const isLoggedIn = computed(() => !!authStore.user)

onMounted(async () => {
  await commentsStore.fetchComments(props.locationId)
})

async function handleSubmit() {
  if (!newCommentText.value.trim()) return

  try {
    await commentsStore.addComment(props.locationId, {
      text: newCommentText.value.trim()
    } as NewComment)
    newCommentText.value = ''
  } catch (error) {
    console.error('Failed to add comment:', error)
  }
}

async function handleDelete(commentId: string) {
  try {
    await commentsStore.deleteComment(commentId, props.locationId)
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

function formatDate(timestamp: any) {
  if (!timestamp?.toDate) return ''
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
}
</script>

<template>
  <v-card class="mt-4">
    <v-card-title class="text-h6">
      Comments
    </v-card-title>

    <v-card-text>
      <!-- Add Comment Form -->
      <v-form @submit.prevent="handleSubmit" v-if="isLoggedIn">
        <v-textarea
          v-model="newCommentText"
          label="Add a comment"
          rows="2"
          hide-details
          class="mb-2"
        ></v-textarea>
        <v-btn
          color="primary"
          type="submit"
          :disabled="!newCommentText.trim()"
          :loading="commentsStore.loading"
        >
          Post Comment
        </v-btn>
      </v-form>
      <v-alert
        v-else
        type="info"
        text="Please sign in to post comments"
        class="mt-2"
      ></v-alert>

      <!-- Comments List -->
      <v-list v-if="commentsStore.comments.length > 0">
        <v-list-item
          v-for="comment in commentsStore.comments"
          :key="comment.id"
          class="mt-2"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-circle" class="mr-2"></v-icon>
          </template>
          
          <v-list-item-title>{{ comment.userDisplayName }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatDate(comment.createdAt) }}</v-list-item-subtitle>
          
          <v-list-item-text class="mt-2">
            {{ comment.text }}
          </v-list-item-text>

          <template v-slot:append>
            <v-btn
              v-if="authStore.user?.uid === comment.userId"
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="handleDelete(comment.id)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <v-alert
        v-else-if="!commentsStore.loading"
        type="info"
        text="No comments yet"
        class="mt-2"
      ></v-alert>

      <!-- Loading State -->
      <v-progress-circular
        v-if="commentsStore.loading"
        indeterminate
        class="mt-4"
      ></v-progress-circular>

      <!-- Error State -->
      <v-alert
        v-if="commentsStore.error"
        type="error"
        :text="commentsStore.error"
        class="mt-2"
      ></v-alert>
    </v-card-text>
  </v-card>
</template> 