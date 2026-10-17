/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '@/stores'
import router from '@/router'
import { configureAuthHandling } from '@/services/api'

export function registerPlugins (app) {
  configureAuthHandling(() => {
    if (router.currentRoute.value.name !== 'Login') {
      router.replace({ name: 'Login' })
    }
  })
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
