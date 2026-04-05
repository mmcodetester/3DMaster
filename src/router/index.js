/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import MonthlyAmount from '@/views/MonthlyAmount.vue'
import Order from '@/views/Order.vue'
import DailyReport from '@/views/Report/DailyReport.vue'
import DetailsReport from '@/views/Report/DetailsReport.vue'
import OtherOrderReport from '@/views/Report/OtherOrderReport.vue'
import WeeklyReport from '@/views/Report/WeeklyReport.vue'
import WeeklyReportPerUser from '@/views/Report/WeeklyReportPerUser.vue'
import UserList from '@/views/User/UserList.vue'

import { createRouter, createWebHistory } from 'vue-router'
const routes = [
  {
    path:'/',
    name:'Home',
    component: Home,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/login',
    name:'Login',
    component: Login,
    meta:{
      layout:'login-layout'
    }
  },
  {
    path:'/monthly-amount',
    name:'MonthlyAmount',
    component: MonthlyAmount,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/order',
    name:'Order',
    component: Order,
    meta:{
      layout:'default-layout'
    }
  },
   {
    path:'/user',
    name:'User',
    component: UserList,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/details-report',
    name:'DetailsReport',
    component: DetailsReport,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/daily-report',
    name:'DailyReport',
    component: DailyReport,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/weekly-report',
    name:'WeeklyReport',
    component: WeeklyReport,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/weekly-per-user-report',
    name:'WeeklyReportPerUser',
    component: WeeklyReportPerUser,
    meta:{
      layout:'default-layout'
    }
  },
  {
    path:'/other-order-report',
    name:'OtherOrderReport',
    component: OtherOrderReport,
    meta:{
      layout:'default-layout'
    }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
