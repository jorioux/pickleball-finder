import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/locations/create',
      name: 'create-location',
      component: () => import('../views/locations/CreateLocation.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/locations/my',
      name: 'my-locations',
      component: () => import('../views/locations/MyLocations.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/locations/:id',
      name: 'location-details',
      component: () => import('../views/locations/LocationDetails.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/reports',
      name: 'admin-reports',
      component: () => import('../views/admin/Reports.vue'),
      beforeEnter: async (to, from, next) => {
        const auth = useAuthStore()
        // Wait for auth state to be loaded
        if (auth.loading) {
          await new Promise<void>((resolve) => {
            const unwatch = auth.$subscribe((mutation, state) => {
              if (!state.loading) {
                unwatch()
                resolve()
              }
            })
          })
        }
        if (auth.user?.email === 'riouxjo@gmail.com') {
          next()
        } else {
          next('/')
        }
      }
    }
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  
  // Wait for auth state to be loaded
  if (auth.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = auth.$subscribe((mutation, state) => {
        if (!state.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  if (to.meta.requiresAuth && !auth.user) {
    // If route requires auth and user is not logged in, redirect to home
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
