<template>
  <v-app>
    <component :is="layoutComponent" :key="layoutKey">
      <router-view />
    </component>
  </v-app>
</template>

<script setup>
import DefaultLayout from './layouts/DefaultLayout.vue'
import LoginLayout from './layouts/LoginLayout.vue'

const route = useRoute()
const layoutKey = computed(() => route.meta.layout || 'default-layout')
const layoutComponent = computed(() => {
  console.log(route.meta.layout)
  switch (route.meta.layout) {
    case 'login-layout':
      return LoginLayout
    default:
      return DefaultLayout
  }
})
</script>
