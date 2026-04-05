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
   <UnauthorizeDialog ref="unauthorizeRef"/>
   
</template>
<script setup>
import ordertotalService from '@/services/report/ordertotal.service';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import constants from '@/utils/constants';
import DailyCompairsm from './Dashboard/DailyCompairsm.vue';
import MonthlyCompairsm from './Dashboard/MonthlyCompairsm.vue';
import weeklyreportService from '@/services/report/weeklyreport.service';
import WeeklyCompairsm from './Dashboard/WeeklyCompairsm.vue';
const snackbarRef = ref(null)
const unauthorizeRef = ref(null)
const ordertotal = ref({
    today_total : 0,
    weekly_total : 0,
    today_extra_total : 0,
    extra_total : 0,
    monthly_total : 0,
    yearly_total : 0
})
const OrderTotal =()=>{
    ordertotalService.Get().then((res)=>{
        ordertotal.value = res.data
    }).catch((err)=>{
        if(err.message == constants.UnauthorizeMessage){
            unauthorizeRef.value.OpenDialog()
        }else{
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    }).finally(()=>{
         GetDetailsTotalAmount()
    })
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
    weeklyreportService.GetDetailsTotalAmount(pagination.value).then((res) => {
       ordertotal.value.weekly_total = res.data.total
       ordertotal.value.extra_total = res.data.extra
    }).catch((err) => {
        console.log(err)
    }).finally(() => {

    })
}
onMounted(()=>{
   
    OrderTotal()
    
})
</script>