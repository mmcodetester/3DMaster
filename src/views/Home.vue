<template>
   <v-col cols="12">
        <v-row>
            <v-col :cols="$vuetify.display.smAndDown? 12: 4">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">Daily Total</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.today_total ?? 0 }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col :cols="$vuetify.display.smAndDown? 12: 4">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">Monthly Total</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.monthly_total ?? 0 }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
            <v-col :cols="$vuetify.display.smAndDown? 12: 4">
                <v-card class="text-center" variant="flat" color="primary" :elevation="10">
                    <v-card-text>
                        <p class=" font-weight-bold text-h6">Yearly Total</p>
                        <p class="mt-1 font-weight-bold text-subtitle-1">{{ ordertotal.yearly_total ?? 0 }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
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
const snackbarRef = ref(null)
const unauthorizeRef = ref(null)
const ordertotal = ref({
    today_total : 0,
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

    })
}
onMounted(()=>{
    OrderTotal()
})
</script>