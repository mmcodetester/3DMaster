/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'
import LoginLayout from './layouts/LoginLayout.vue'
import DefaultLayout from './layouts/DefaultLayout.vue'
import VueApexCharts from "vue3-apexcharts";
import VueSocketIO from '@hlf01/vue3-socket.io'
const vue3SocketIO = new VueSocketIO({
    debug: false,
    connection: import.meta.env.VITE_SOCKET_URL,
    options: {  withCredentials: true, transports: ["websocket", "polling"] }
});
const app = createApp(App)
app.use(vue3SocketIO)
app.use(VueApexCharts);
app.component('login-layout', LoginLayout)
app.component('default-layout', DefaultLayout)


registerPlugins(app)

app.mount('#app')
