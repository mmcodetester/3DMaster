<template>
  <v-app>
    <component :is="layoutComponent" :key="layoutKey">

      <router-view />
    </component>
  </v-app>
</template>

<script setup>
  import { useSocketIO } from '@hlf01/vue3-socket.io'
  import ChatLayout from './layouts/ChatLayout.vue'
  import DefaultLayout from './layouts/DefaultLayout.vue'
  import LoginLayout from './layouts/LoginLayout.vue'
  import { useAppStore } from './stores/app'
  const io = inject('socket')
  const store = useAppStore()
  const socket = useSocketIO()
  const route = useRoute()
  const layoutKey = computed(() => route.meta.layout || 'default-layout')
  const layoutComponent = computed(() => {
    switch (route.meta.layout) {
      case 'login-layout': {
        return LoginLayout
      }
      case 'chat-layout': {
        return ChatLayout
      }
      default: {
        return DefaultLayout
      }
    }
  })

  onMounted(() => {
    socket.subscribe('fullnumbers', data => {
      store.fullOrderList = []
      if (data) {
        store.SetFullOrderList(data)
      }
    })
    io.emit('getfullnumber', '123')
  })
</script>
