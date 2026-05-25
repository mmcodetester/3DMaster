<template>
  <app-bar />

  <v-main>
    <v-row v-if="!isConnected">
      <v-col cols="12" class="text-center">
        <p class="text-red">No Internet Connection</p>
      </v-col>
    </v-row>
    <slot />
  </v-main>
</template>

<script setup>
import AppBar from '@/components/AppBar.vue';
import { Network } from '@capacitor/network';
const isConnected = ref(false)
const logCurrentNetworkStatus = async () => {
  const status = await Network.getStatus();

    isConnected.value = status.connected
};
onMounted(async() => {
  Network.addListener('networkStatusChange', status => {
     isConnected.value = status.connected
  });
  await logCurrentNetworkStatus()
})
</script>
