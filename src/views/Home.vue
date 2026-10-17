<template>
   <v-col cols="12">
        <v-row class="justify-center">
            <v-col :cols="$vuetify.display.smAndDown? 11: 3">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">ယနေ့</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.today_total ?? 0 }} + {{ ordertotal.today_extra_total ?? 0 }} = {{ ordertotal.today_total + ordertotal.today_extra_total }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col :cols="$vuetify.display.smAndDown? 11: 3">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">ယခုအပတ်</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.weekly_total ?? 0 }} + {{ ordertotal.extra_total ?? 0 }} = {{ (ordertotal.weekly_total  + ordertotal.extra_total) ??0 }} </p>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col :cols="$vuetify.display.smAndDown? 11: 3">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">ယခုလ</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.monthly_total ?? 0 }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col :cols="$vuetify.display.smAndDown? 11: 3">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">ယခုနှစ်</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.yearly_total ?? 0 }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <WeeklyCompairsm/>
        <DailyCompairsm/>
        <MonthlyCompairsm/>
   </v-col>

   <SnackbarDialog ref="snackbarRef"/>
   
</template>
<script setup>
import ordertotalService from '@/services/report/ordertotal.service';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import DailyCompairsm from './Dashboard/DailyCompairsm.vue';
import MonthlyCompairsm from './Dashboard/MonthlyCompairsm.vue';
import weeklyreportService from '@/services/report/weeklyreport.service';
import WeeklyCompairsm from './Dashboard/WeeklyCompairsm.vue';
import { getLoginInfo } from '@/services/auth.session.js';
import dropdownService from '@/services/dropdown.service.js';
const snackbarRef = ref(null)
const year = new Date().getFullYear()
const weeklyList = ref([])
const ordertotal = ref({
    today_total : 0,
    weekly_total : 0,
    today_extra_total : 0,
    extra_total : 0,
    monthly_total : 0,
    yearly_total : 0
})
const handleLoadError = err => {
    if (err.response?.status === 401 || err.code === 'ERR_CANCELED' || !getLoginInfo()) return
    snackbarRef.value?.OpenSnackbar('red darken-2', err.message)
}
const OrderTotal = async () => {
    if (!getLoginInfo()) return
    try {
        const res = await ordertotalService.Get()
        if (!getLoginInfo()) return
        ordertotal.value = res.data
        GetDetailsTotalAmount()
    } catch (err) {
        handleLoadError(err)
    }
}
const GetInitialWeeklyAmountList = async () => {
    if (!getLoginInfo()) return
    try {
        const res = await dropdownService.GetAllWeeklyAmountList()
        if (!getLoginInfo()) return
        weeklyList.value = res.data
        const active = res.data.find(item => item.status) || res.data[0]
        pagination.value.search.monthly_amount_id = active?.id ?? null
        OrderTotal()
    } catch (err) {
        handleLoadError(err)
    }
}
const pagination = ref({
    search: {
        name: '',
        role_id: null,
        user_id: null,
        year : new Date().getFullYear(),
        monthly_amount_id : null,
        number: null,
        date: new Date()
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "number", order: "desc" }],
})
const GetDetailsTotalAmount = () => {
    if (!getLoginInfo() || !pagination.value.search.monthly_amount_id) return
    weeklyreportService.GetDetailsTotalAmount(pagination.value).then((res) => {
       if (!getLoginInfo()) return
       ordertotal.value.weekly_total = res.data.total
       ordertotal.value.extra_total = res.data.extra
    }).catch((err) => {
        handleLoadError(err)
    })
}

onMounted(() => {
    GetInitialWeeklyAmountList()
})
</script>
