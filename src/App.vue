<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import { computed } from 'vue'

const route = useRoute() // Get the current route object

// Compute if the current route is the home page
const isHomePage = computed(() => {
  // Adjust this condition based on your home page's route name or path
  // If your home page's route is named 'home':
  return route.name === 'home'
  // Or if its path is '/':
  // return route.path === '/'
})
</script>

<template>
  <DefaultLayout :is-home-page="isHomePage">
    <RouterView />
  </DefaultLayout>
</template>
