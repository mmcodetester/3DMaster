<template>
  <app-bar />

  <v-main>
    <v-row v-if="!isConnected">
      <v-col class="text-center" cols="12">
        <p class="text-red">No Internet Connection</p>
      </v-col>
    </v-row>
    <slot />
  </v-main>
</template>

<script setup>
  import { Network } from '@capacitor/network'
  import { useRouter } from 'vue-router'
  import AppBar from '@/components/AppBar.vue'
  import { configureChatNavigation, startChat, stopChat, syncChat } from '@/services/chat.state'
  import { useAppStore } from '@/stores/app'
  const router = useRouter()
  configureChatNavigation(roomId => {
    void router.push({ name: 'LiveChat', query: { room: String(roomId) } })
  })
  let networkListener
  onUnmounted(() => {
    stopChat()
    networkListener?.remove()
  })
  const store = useAppStore()

  const isConnected = ref(false)
  async function logCurrentNetworkStatus () {
    const status = await Network.getStatus()

    isConnected.value = status.connected
    store.SetNetworkState(status.connected)
  }
  onMounted(async () => {
    startChat().catch(console.error)
    networkListener = await Network.addListener('networkStatusChange', status => {
      isConnected.value = status.connected
      store.SetNetworkState(status.connected)
      if (status.connected) void syncChat()
    })
    await logCurrentNetworkStatus()
  })
</script>
