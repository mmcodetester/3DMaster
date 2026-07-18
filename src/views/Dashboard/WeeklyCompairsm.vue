<template>
    <v-row>
        <v-col cols="12">
            <v-card class="text-center">
                <v-card-text>
                    <v-pie :size="$vuetify.display.smAndDown ? 300 :378" title="Weekly Compairsm" legend reveal :palette="['#048BA8', '#99C24D', '#F18F01']"
                        :items="items">
                        <template v-slot:legend-text="{ item }">
                            <div class="d-flex justify-space-between align-center w-full my-1">
                                <span class="text-primary font-weight-bold">{{ item.title }}</span>
                                <span class="font-weight-bold ml-2">
                                    {{ item.value }} + {{ item.raw.extra }} = {{ item.value + (item.raw.extra ?? 0) }}
                                </span>
                            </div>
                        </template>
                    </v-pie>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
<script setup>
import dropdownService from '@/services/dropdown.service';
import weeklyamountperuserService from '@/services/report/weeklyamountperuser.service';
const items = ref([])
const weeklyList = ref([])
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
const Get = () => {
    weeklyamountperuserService.GetCompairsm(pagination.value).then((res) => {
       /// console.log(res)
        items.value = res.data
    }).catch((err) => {

    }).finally(() => {

    })
}
const GetInitialWeeklyAmountList = () =>{
    dropdownService.GetAllWeeklyAmountList().then((res)=>{
        weeklyList.value = res.data
         console.log(res.data)
        const filter = res.data.filter(x=>x.status)[0]
       
        if(filter){
            console.log('initital')
            pagination.value.search.monthly_amount_id = filter.id
        }else{
             pagination.value.search.monthly_amount_id = res.data[0].id
        }
          OrderTotal()
    }).catch((err)=>{

    }).finally(()=>{
       Get()
    })
}

onMounted(() => {
   GetInitialWeeklyAmountList()
})
</script>