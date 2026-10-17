/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import VueSocketIO from '@hlf01/vue3-socket.io'

import { vLongpress } from '@nanogiants/vue3-longpress'
// Composables
import { createApp } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Plugins
import { registerPlugins } from '@/plugins'
// Components
import App from './App.vue'
import ChatLayout from './layouts/ChatLayout.vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import LoginLayout from './layouts/LoginLayout.vue'
// Styles
import 'unfonts.css'
const vue3SocketIO = new VueSocketIO({
  debug: false,
  connection: import.meta.env.VITE_SOCKET_URL,
  options: { withCredentials: true, transports: ['websocket', 'polling'] },
})
const app = createApp(App)
app.use(vue3SocketIO)
app.use(VueApexCharts)
app.directive('use-longpress', vLongpress)
app.component('login-layout', LoginLayout)
app.component('default-layout', DefaultLayout)
app.component('chat-layout', ChatLayout)

registerPlugins(app)

app.mount('#app')
