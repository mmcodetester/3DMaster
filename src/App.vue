<template>
  <v-app>
    <component :is="layoutComponent" :key="layoutKey">
      <router-view />
    </component>
  </v-app>
</template>

<script setup>
import { useSocketIO } from '@hlf01/vue3-socket.io'
import DefaultLayout from './layouts/DefaultLayout.vue'
import LoginLayout from './layouts/LoginLayout.vue'
import { useAppStore } from './stores/app'
const {proxy} = getCurrentInstance()
const store = useAppStore()
const socket = useSocketIO()
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
onMounted(()=>{
  socket.subscribe('fullnumbers',(data)=>{
    store.SetFullOrderList(data)
  })
  proxy.$socket.emit('getfullnumber', {text:'Give me some full data'})
})
</script>
