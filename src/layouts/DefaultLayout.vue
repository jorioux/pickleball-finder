<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'

interface Props {
  isHomePage: boolean
}
const props = defineProps<Props>()

const auth = useAuthStore()
const theme = useThemeStore()
const isLoggedIn = computed(() => !!auth.user)
const userEmail = computed(() => auth.user?.email)
const userName = computed(() => auth.user?.displayName)
const isAdmin = computed(() => auth.user?.email === 'riouxjo@gmail.com')

const handleLogin = () => {
  auth.signInWithGoogle()
}

const handleLogout = () => {
  auth.signOut()
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>Pickleball Finder</v-app-bar-title>
      <v-btn to="/" text>Map</v-btn>

      <template v-if="!auth.loading">
        <template v-if="isLoggedIn">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                class="ml-2"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                to="/locations/create"
                title="Add a pickleball location"
                prepend-icon="mdi-map-marker-plus"
              />
            </v-list>
          </v-menu>

          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                class="ml-2"
              >
                <v-icon>mdi-account-circle</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-list-item-title class="text-subtitle-1 font-weight-medium">
                  {{ userName || 'User' }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ userEmail }}
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-divider class="my-2"></v-divider>
              
              <v-list-item
                to="/locations/my"
                title="My Locations"
                prepend-icon="mdi-map-marker"
              />

              <v-list-item
                v-if="isAdmin"
                to="/admin/reports"
                title="Manage Reports"
                prepend-icon="mdi-flag"
              />

              <v-list-item
                @click="theme.toggleTheme"
                :title="theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                :prepend-icon="theme.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
              />
              
              <v-list-item
                @click="handleLogout"
                title="Sign Out"
                prepend-icon="mdi-logout"
              />
            </v-list>
          </v-menu>
        </template>
        <template v-else>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                v-bind="props"
                class="ml-2"
              >
                <v-icon>mdi-account-circle</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                @click="handleLogin"
                title="Sign in with Google"
                prepend-icon="mdi-google"
              />
              <v-list-item
                @click="theme.toggleTheme"
                :title="theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                :prepend-icon="theme.isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
              />
            </v-list>
          </v-menu>
        </template>
      </template>
      <template v-else>
        <v-btn
          icon
          disabled
          class="ml-2"
          :loading="true"
        >
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <slot></slot>
    </v-main>

    <v-snackbar
      v-model="auth.snackbar.show"
      :color="auth.snackbar.color"
      :timeout="4000"
    >
      {{ auth.snackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="auth.snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
