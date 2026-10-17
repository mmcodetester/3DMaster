<template>
  <v-main class="chat-layout">
    <slot />
  </v-main>
</template>

<script setup>
  import { Network } from '@capacitor/network'
  import { onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { configureChatNavigation, stopChat, syncChat } from '@/services/chat.state'
  import { useAppStore } from '@/stores/app'

  const router = useRouter()
  const store = useAppStore()
  let networkListener, disposed = false

  configureChatNavigation(roomId => {
    void router.push({ name: 'LiveChat', query: { room: String(roomId) } })
  })

  onMounted(async () => {
    try {
      const listener = await Network.addListener('networkStatusChange', status => {
        if (disposed) return
        store.SetNetworkState(status.connected)
        if (status.connected) void syncChat()
      })
      if (disposed) {
        await listener.remove()
        return
      }
      networkListener = listener
      const status = await Network.getStatus()
      if (!disposed) store.SetNetworkState(status.connected)
    } catch (error) {
      console.error('Chat network status unavailable:', error)
    }
  })

  onUnmounted(() => {
    disposed = true
    stopChat()
    void networkListener?.remove()
  })
</script>

<style scoped>
:global(html:has(.chat-layout)) { overflow: hidden !important; }
.chat-layout { display: block; height: 100dvh; min-height: 0; overflow: hidden; }
</style>
