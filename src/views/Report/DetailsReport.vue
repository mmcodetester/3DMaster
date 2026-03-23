<template>
    <v-col cols="12">
       
    <v-row>
            <v-col cols="12" sm="12" md="12">
                <v-expansion-panels>
                    <v-expansion-panel elevation="5">
                        <v-expansion-panel-title> Search </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row cols="12" justify="start" class="mt-n4">
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">Date</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text"
                                        density="compact" readonly @click.stop="dateDialog = !dateDialog" v-model="dateStr" variant="outlined"></v-text-field>
                                </v-col>
                                <v-col cols="12" md="6"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" @click.stop="Reset" class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2" @click.stop="GetAll">Search</v-btn>
                                    <v-btn size="small" :loading="excelLoading" @click.stop="ExportExcel" color="success" class="mr-0" variant="outlined" append-icon="mdi-file-excel">Export Excel</v-btn>
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
                         <span class="text-subtitle-1 font-weight-bold"> Detail Report List</span>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-col cols="12">
                            <v-data-table-server sort-desc-icon="mdi-sort-descending" sort-asc-icon="mdi-sort-ascending"
                                :fixed-header="true" :fixed-footer="true" search="name" @update:options="GetAll"
                                :items="items" :headers="headers" :must-sort="true" :items-length="recordTotal"
                                :loading="loading" item-key="id" v-model:sort-by="pagination.sortBy"
                                 v-model:page="pagination.page" :items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">
                                <template v-slot:['item.actions']="{item}">
                                    <v-btn rounded="lg" color="red-darken-2" class="ml-2" size="small" variant="outlined" prepend-icon="mdi-trash-can-outline" @click.stop="ConfirmDelete(item.id)">Delete</v-btn>
                                </template>
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
        <UnauthorizeDialog ref="unauthorizeRef"/>
        <SnackbarDialog ref="snackbarRef"/>
        <ConfirmDialog ref="confirmRef" @confirm="Delete"/>
    </v-col>
</template>
<script setup>
import dailyreportService from '@/services/report/dailyreport.service';
import constants from '@/utils/constants';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import moment from 'moment';

const dateStr = ref('')

const excelLoading = ref(false)

const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const  confirmRef = ref(null)
const dateDialog = ref(false)
const loading = ref(false)

const selected_id = ref(0)
const pagination = ref({
    search:{
        name :'',
        role_id : null,
        date : new Date()
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "number", order: "desc" }],
})
const headers = [
    { title: 'Number', key: 'number', sortable: true },
    { title: 'Month', key: 'month', sortable: true },
     { title: 'Amount', key: 'amount', sortable: true },
    { title: 'Date', key: 'date', sortable: true },
    { title: 'Create By', key: 'order_by', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false  , align:'center'},
];
const recordTotal = ref(0);
const items = ref([]);

const GetAll=()=>{
    loading.value = true
    dailyreportService.GetAllDetailReport(pagination.value).then((res)=>{
        console.log(res)
        items.value = res.data.data
        recordTotal.value = res.data.total
    }).catch((err)=>{
       if(err.message == constants.UnauthorizeMessage){
            unauthorizeRef.value.OpenDialog()
       }else{
        snackbarRef.value.OpenSnackbar('red darken-2', err.message)
       }
       
    }).finally(()=>{    
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
const ConfirmDelete = (id) =>{
    selected_id.value = id
    confirmRef.value.OpenDialog('Daily Report Delete Alert', 'Are you sure to delete this record?')
}
const Delete = (val) =>{
    if(val){
        dailyreportService.Delete(selected_id.value).then((res)=>{
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            if(res.data.success){
                GetAll()
            }
            snackbarRef.value.OpenSnackbar(color, message)
        }).catch((err)=>{
            if(err.message == constants.UnauthorizeMessage){
                unauthorizeRef.value.OpenDialog()
            }else{
                snackbarRef.value.OpenSnackbar('red darken-2', err.message)
            }
        }).finally(()=>{

        })
    }
    selected_id.value = 0
}
const Reset = () =>{
    pagination.value.search.date = new Date()
    dateStr.value = moment(pagination.value.search.date).format('DD/MM/yyyy')
    GetAll()
}
const ExportExcel = () => {
    excelLoading.value = true

    dailyreportService.ExportExcelDetailReport(pagination.value)
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
onMounted(()=>{
    pagination.value.search.date = new Date()
    dateStr.value = moment(pagination.value.search.date).format('DD/MM/yyyy')
})
</script>