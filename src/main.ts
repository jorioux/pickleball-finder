import './assets/main.css'
import '@mdi/font/css/materialdesignicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.globalProperties.$isHomePage = false; // Initialize

router.afterEach((to) => {
  // Update the global property based on the route
  app.config.globalProperties.$isHomePage = (to.name === 'home' || to.path === '/');
  // Manually add/remove the class to the #app element
  const appElement = document.getElementById('app');
  if (appElement) {
    if (app.config.globalProperties.$isHomePage) {
      appElement.classList.add('no-app-padding');
    } else {
      appElement.classList.remove('no-app-padding');
    }
  }
});

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
