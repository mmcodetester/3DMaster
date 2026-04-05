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
                                    <p class="text-body-2 mt-3">Year </p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-number-input v-model="pagination.search.year" type="number" density="compact" variant="outlined"/>
                                </v-col>
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4 mt-n8`">
                                    <p class="text-body-2 mt-3">Month</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-autocomplete :items="monthList" item-title="month_name" item-value="id" type="text" density="compact" variant="outlined"/>
                                </v-col>
                            </v-row>
                            <v-row cols="12" justify="start" class="mt-n4">

                                <v-col cols="12" md="12"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" class="mr-2" @click.stop="Reset">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2" @click.stop="GetAll">Search</v-btn>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card elevation="10">
                    <v-card-title>
                        <v-icon color="primary" @click.stop="OpenEntry(0)" size="25"
                            class="mr-2">mdi-plus-circle-outline</v-icon> <span
                            class="text-subtitle-1 font-weight-bold"> Monthly Amount List</span>
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
                                <template v-slot:['item.status']="{ item }">
                                    <v-btn rounded="lg" :color="item.status ? 'success' : 'red-darken-4'" class="ml-2"
                                        size="small" variant="outlined"
                                        :prepend-icon="item.status ? 'mdi-check' : 'mdi-close'"
                                        @click.stop="ConfirmChangeStauts(item.id)"
                                        :disabled="activeAmount.hasActiveAmount ? activeAmount?.hasActiveAmount && activeAmount?.id !== item.id : false">
                                        {{ item.status ? 'Active' : 'Inactive' }}
                                    </v-btn>
                                </template>
                                <template v-slot:['item.actions']="{ item }">
                                    <v-btn rounded="lg" color="grey-darken-4" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-square-edit-outline"
                                        @click.stop="OpenEntry(item.id)">Edit</v-btn>
                                    <v-btn rounded="lg" color="red-darken-2" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-trash-can-outline">Delete</v-btn>
                                </template>
                            </v-data-table-server>
                        </v-col>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-col>
    <MonthlyAmountEntry ref="entryRef" @saved="GetAll" />
    <UnauthorizeDialog ref="unauthorizeRef" />
    <SnackbarDialog ref="snackbarRef" />
    <ConfirmDialog ref="confirmRef" @confirm="ChangeStatus" />
</template>
<script setup>
import MonthlyAmountEntry from './MonthlyAmountEntry.vue';
import service from '@/services/monthly.amount.service'
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import constants from '@/utils/constants';
import dropdownService from '@/services/dropdown.service';
const entryRef = ref(null)
const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const confirmRef = ref(null)
const loading = ref(false)
const selected_id = ref(0)
const monthList = ref([])
const io = inject('socket')
const activeAmount = ref({
    hasActiveAmount: false,
    id: null
})
const pagination = ref({
    search:{
        year: new Date().getFullYear(),
        month_id : null
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "id", order: "desc" }],
})
watch(() => pagination.value.sortBy, (newVal) => {
    console.log('sort by changed', newVal);
}, { deep: true });
const headers = [
    { title: 'Year ', key: 'year', sortable: true },
    { title: 'Month', key: 'month_name', sortable: true },
    { title: 'From Day', key: 'from_day', sortable: true },
    { title: 'To Day', key: 'to_day', sortable: true },
    { title: 'Amount', key: 'amount', sortable: true },
    { title: 'Status', key: 'status', sortable: false, align: 'center', minWidth: '230' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center', minWidth: '230' },
];
const recordTotal = ref(0);
const items = ref([]);

const OpenEntry = (id) => {
    entryRef.value.OpenDialog(id)
}
const GetAll = () => {
    loading.value = true
    service.GetAll(pagination.value).then((res) => {
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
const Reset = () =>{
    pagination.value.search.month_id = null
    pagination.value.search.year = new Date().getFullYear()
}
const GetMonthList = () =>{
    dropdownService.GetMonthList().then((res)=>{
        monthList.value = res.data
    }).catch((err)=>{
        if(err.message == constants.UnauthorizeMessage){
            unauthorizeRef.value.OpenDialog()
        }else{
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    }).finally(()=>{

    })
}
const Delete = (id) => {

}

const ConfirmChangeStauts = (id) => {
    selected_id.value = id
    confirmRef.value.OpenDialog('Status Change Alert', 'Are you sure to change status for this recrod?')
}
const ChangeStatus = (res) => {
    if (res) {
        service.ChangeStauts(selected_id.value).then((res) => {
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            snackbarRef.value.OpenSnackbar(color, message)
            if(res.data.succss){
                io.emit('getfullnumber',"123")
            }
        }).catch((err) => {

        }).finally(() => {
            selected_id.value = 0
            GetActiveAmount()
            GetAll()
        })
    } else {
        selected_id.value = 0
    }

}
const ConfirmDelete = (id) => {

}
const GetActiveAmount = () => {
    service.GetActiveAmount().then((res) => {
        if (res.data) {
            activeAmount.value.hasActiveAmount = res.data.status ?? false
            activeAmount.value.id = res.data.id ?? null
            console.log(activeAmount.value)
        } else {
            activeAmount.value.hasActiveAmount = false
            activeAmount.value.id = null
        }
    }).catch((err) => {

    }).finally(() => {

    })
}
onMounted(() => {
    pagination.value.search.year = new Date().getFullYear()
    
    GetActiveAmount()
    GetMonthList()
})
</script>