<template>
  <v-navigation-drawer v-model="drawer" width="350">
    <v-list-item class="text-center">
      <v-avatar :image="Logo" border="sm" contain>
      </v-avatar>
      <p class="text-primary font-weight-bold">3D NOTE </p>
    </v-list-item>
    <v-divider></v-divider>
    <v-list density="compact">
      <div v-for="item in items" :key="item.id">
        <v-list-group v-if="item.children && item.children.length > 0">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :title="item.title" style="letter-spacing: 5px;">
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-n4" :icon="item.icon" />
              </template>
            </v-list-item>
          </template>

          <v-list-item v-for="subtitle in item.children" :key="subtitle.id" class="ml-n4 text-subtitle-2"
            style="letter-spacing: 2px;" link :title="subtitle.title" :append-icon="subtitle.icon" :to="subtitle.url"
            color="primary" />
        </v-list-group>

        <!-- Parent with no children -->
        <!-- v-show="hasPermission(item.program_code)" -->
        <v-list-item v-else style="letter-spacing: 5px;" density="compact" link :title="item.title" color="primary"
          :to="item.url">
          <template v-slot:prepend>
            <v-icon color="primary" class="mr-n4" :icon="item.icon" />
          </template>
        </v-list-item>
      </div>
    </v-list>
  </v-navigation-drawer>
  <v-app-bar>
    <v-app-bar-title class="text-primary">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      3D Notes
    </v-app-bar-title>
    <v-spacer></v-spacer>
    <v-menu location="bottom">
      <template #activator="{ props }">
        <v-icon size="25" location="top right" v-bind="props" class="mr-4">
          mdi-account
        </v-icon>
      </template>

      <v-card width="250">
        <v-card-text>
          <v-list-item class="text-center font-weight-bold text-subtitle-1">
            <v-icon size="30" color="primary">mdi-account-circle-outline</v-icon>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item class="text-center font-weight-bold text-subtitle-2">
            {{ store.loginUser.name }}
          </v-list-item>
          <v-list-item>
            <v-btn color="error" block @click.stop="Logout">Logout</v-btn>
          </v-list-item>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-app-bar>

</template>
<script setup>
import Logo from '../assets/logo.jpg'
const router = useRouter()
const drawer = ref(false)
const store = ref({
  loginUser: {
    id: null,
    name: '',
    username: '',
  },
})
const items = ref([
  { id: 1, title: 'မူလစာမျက်နှာ', url: '/', icon: 'mdi-view-dashboard', children: [] },
  { id: 2, title: 'အော်ဒါစာရင်းတင်ခြင်း', url: '/order', icon: 'mdi-cart-outline', children: [] },
  { id: 3, title: 'အပတ်စဉ်လက်ခံစာရင်း', url: '/monthly-amount', icon: 'mdi-currency-usd', children: [] },
  { id: 4, title: 'စနစ်အသုံးပြုသူ', url: '/user', icon: 'mdi-account-multiple-outline', children: [] },
  {
    id: 5, title: 'အစီအရင်ခံစာများ', url: '/reports', icon: 'mdi-file-table-outline', children: [
      { id: 6, title: 'နေ့စဉ်အော်ဒါစာရင်း(အားလုံး)', url: '/details-report', icon: 'mdi-chevron-right' },
      { id: 7, title: 'နေ့စဉ်အော်ဒါစာရင်း(ဂဏန်းဖြင့်)', url: '/daily-report', icon: 'mdi-chevron-right' },
      { id: 8, title: 'အပတ်စဉ်အော်ဒါစာရင်း', url: '/weekly-report', icon: 'mdi-chevron-right' },
      { id: 8, title: 'ကော်စားအော်ဒါစာရင်း', url: '/weekly-per-user-report', icon: 'mdi-chevron-right' },
      { id: 9, title: 'ဒိုင်ကြီးထံတင်မည့်စာရင်း', url: '/other-order-report', icon: 'mdi-chevron-right' },
    ]
  },
])
const Logout = () => {
  localStorage.removeItem('2duser')
  router.push({name:'Login'})
}
onMounted(() => {
  const user = localStorage.getItem('2duser')
  if (user) {
    const userStr = JSON.parse(JSON.stringify(user))
     const loginUser = JSON.parse(userStr)
     store.value.loginUser.id = loginUser.data.id
     store.value.loginUser.username = loginUser.data.username
     store.value.loginUser.name = loginUser.data.name
  }
})
</script>