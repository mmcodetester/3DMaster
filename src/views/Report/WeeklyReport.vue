<template>
    <v-col cols="12">

        <v-row>
            <v-col cols="12" sm="12" md="12">
                <v-expansion-panels>
                    <v-expansion-panel elevation="5">
                        <v-expansion-panel-title> ရှာဖွေမည် </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row cols="12" justify="start" class="mt-n1">
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">ရက်စွဲ</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-number-input type="text" density="compact" v-model="pagination.search.year"
                                        variant="outlined"/>
                                </v-col>
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">အပတ်စဉ်</p>
                                </v-col>
                                <v-col cols="12" md="4">
                                    <v-autocomplete :items="weeklyList" item-title="name" item-value="id"
                                        v-model="pagination.search.monthly_amount_id" density="compact"
                                        variant="outlined"></v-autocomplete>
                                </v-col>

                            </v-row>
                            <v-row class="mt-n4">
                                 <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">နံပါတ်</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text" v-model="pagination.search.number" density="compact"
                                        variant="outlined" />
                                </v-col>
                               
                                <v-col cols="12" md="6"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" @click.stop="Reset"
                                        class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2" @click.stop="GetAllData">Search</v-btn>
                                    <v-btn size="small" :loading="excelLoading" @click.stop="ExportExcel"
                                        color="success" class="mr-0" variant="outlined"
                                        append-icon="mdi-file-excel">Export Excel</v-btn>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card elevation="2">
                    <v-card-title>
                        <v-row>
                            <v-col :cols=" $vuetify.display.smAndDown ? 12 : 6" ><span class="text-subtitle-1 font-weight-bold"> အပတ်စဉ်အော်ဒါစာရင်း
                                </span></v-col>
                            <v-col :cols=" $vuetify.display.smAndDown ? 12 : 6"  :class="$vuetify.display.smAndDown ? 'mt-n6' : 'text-right'"> <span
                                    class="text-subtitle-1 font-weight-bold">စုစုပေါင်း - </span><span
                                    class="text-subtitle-1 text-success font-weight-bold"> {{ total || 0 }} 
                                </span><span
                                    class="text-subtitle-1 font-weight-bold"> နောက်ထိုး - </span><span
                                    class="text-subtitle-1 text-success font-weight-bold"> {{ extra || 0 }} 
                                </span></v-col>
                        </v-row>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-col cols="12">
                            <v-data-table-server sort-desc-icon="mdi-sort-descending" sort-asc-icon="mdi-sort-ascending"
                                :fixed-header="true" :fixed-footer="true" search="name" @update:options="GetAllData"
                                :items="items" :headers="headers" :must-sort="true" :items-length="recordTotal"
                                :loading="loading" item-key="id" v-model:sort-by="pagination.sortBy"
                                v-model:page="pagination.page" :items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">

                            </v-data-table-server>
                        </v-col>
                    </v-card-text>

                </v-card>
            </v-col>
        </v-row>
        <v-dialog persistent v-model="dateDialog">
            <v-row class="justify-center">
                <v-col cols="4">
                    <v-date-picker v-model="pagination.search.date" @update:model-value="ChangeToDate"
                        color="primary"></v-date-picker>
                </v-col>
            </v-row>
        </v-dialog>
        <UnauthorizeDialog ref="unauthorizeRef" />
        <SnackbarDialog ref="snackbarRef" />
    </v-col>
</template>
<script setup>
import dailyreportService from '@/services/report/dailyreport.service';
import constants from '@/utils/constants';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import moment from 'moment';
import dropdownService from '@/services/dropdown.service';
import weeklyreportService from '@/services/report/weeklyreport.service';

const dateStr = ref('')

const excelLoading = ref(false)

const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const confirmRef = ref(null)
const dateDialog = ref(false)
const loading = ref(false)
const userList = ref([])
const weeklyList = ref([])
const total = ref(0)
const extra = ref(0)
const selected_id = ref(0)
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
const headers = [
    { title: 'Number', key: 'number', sortable: true },
    { title: 'Total Amount', key: 'total_amount', sortable: true },
     { title: 'Total Extra', key: 'total_extra', sortable: true },
    { title: 'Year', key: 'year', sortable: false },
    { title: 'Month', key: 'month_name', sortable: false },
    { title: 'From To', key: 'from_to', sortable: true },
];
const recordTotal = ref(0);
const items = ref([]);
const GetAllData =() =>{
    GetDetailsTotalAmount()
    GetAll()
}
const GetAll = () => {
    loading.value = true
    weeklyreportService.GetAll(pagination.value).then((res) => {
        console.log(res)
        items.value = res.data.data
        recordTotal.value = res.data.total
    }).catch((err) => {
        if (err.message == constants.UnauthorizeMessage) {
            unauthorizeRef.value.OpenDialog()
        } else {
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }

    }).finally(() => {
        loading.value = false
    })
}

const ChangeToDate = (val) => {
    if (val) {
        pagination.value.search.date = val
        dateStr.value = moment(pagination.value.search.date).format('DD-MM-yyyy')
        dateDialog.value = !dateDialog.value
    }
}

const Reset = () => {
    pagination.value.search.date = new Date()
    dateStr.value = moment(pagination.value.search.date).format('DD/MM/yyyy')
    pagination.value.search.user_id = null
    pagination.value.search.number = ''
    pagination.value.search.year = new Date().getFullYear()
    pagination.value.search.monthly_amount_id = null
    GetAllData()
}
const ExportExcel = () => {
    excelLoading.value = true
    weeklyreportService.ExportExcel(pagination.value)
        .then((res) => {
            if (res) {
                const blob = new Blob([res.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                })

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url

                const date = moment().format("DD-MM-YYYY_HH-mm")
                a.download = `detail_report_${date}.xlsx`

                document.body.appendChild(a)
                a.click()
                a.remove()
                window.URL.revokeObjectURL(url)
            }
        })
        .catch((err) => {
            if (err.message == constants.UnauthorizeMessage) {
                unauthorizeRef.value.OpenDialog()
            } else {
                snackbarRef.value.OpenSnackbar('red darken-2', err.message)
            }
        })
        .finally(() => {
            excelLoading.value = false
        })
}
const GetDetailsTotalAmount = () => {
    weeklyreportService.GetDetailsTotalAmount(pagination.value).then((res) => {
        console.log(res.data)
        total.value = res.data.total
        extra.value = res.data.extra
    }).catch((err) => {

    }).finally(() => {

    })
}
watch(()=>pagination.value.search.year,(newVal)=>{
    if(newVal){
        GetWeeklyAmountList(newVal)
    }
})
const GetWeeklyAmountList = (year) =>{
    dropdownService.GetWeeklyAmountList(year).then((res)=>{
        weeklyList.value = res.data
        const filter = res.data.filter(x=>x.id == pagination.value.search.monthly_amount_id)
        if(!filter){
            pagination.value.search.monthly_amount_id = null
        }
    }).catch((err)=>{

    }).finally(()=>{

    })
}
const GetInitialWeeklyAmountList = (year) =>{
    dropdownService.GetWeeklyAmountList(year).then((res)=>{
        weeklyList.value = res.data
        
        const filter = res.data.filter(x=>x.status)[0]
        if(filter){
            console.log('initital')
            pagination.value.search.monthly_amount_id = filter.id
        }
    }).catch((err)=>{

    }).finally(()=>{

    })
}
onMounted(() => {
    pagination.value.search.year = new Date().getFullYear()
    GetInitialWeeklyAmountList(pagination.value.search.year)
   
})
</script>