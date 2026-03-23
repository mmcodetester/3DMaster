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

const app = createApp(App)

app.use(VueApexCharts);
app.component('login-layout', LoginLayout)
app.component('default-layout', DefaultLayout)

registerPlugins(app)

app.mount('#app')
