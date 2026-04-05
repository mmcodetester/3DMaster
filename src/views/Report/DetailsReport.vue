<template>
    <v-col cols="12">

        <v-row>
            <v-col cols="12" sm="12" md="12">
                <v-expansion-panels>
                    <v-expansion-panel elevation="5">
                        <v-expansion-panel-title> ရှာဖွေမည် </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row cols="12" justify="start" class="mt-n4">
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">ရက်စွဲ</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text" density="compact" readonly
                                        @click.stop="dateDialog = !dateDialog" v-model="dateStr"
                                        variant="outlined"></v-text-field>
                                </v-col>
                                <v-col cols="12" md="2" 
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4 mt-n8`">
                                    <p class="text-body-2 mt-3">ဂဏန်း</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text" density="compact" v-model="pagination.search.number"
                                        variant="outlined" />
                                </v-col>

                            </v-row>
                            <v-row class="mt-n5">
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4 mt-n6`">
                                    <p class="text-body-2 mt-3">ထည့်သွင်းသူ</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-autocomplete v-model="pagination.search.user_id" :items="userList"
                                        item-title="name" item-value="id" density="compact" variant="outlined" />
                                </v-col>
                                <v-col cols="12" :md="$vuetify.display.smAndDown ? 12:6"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" @click.stop="Reset"
                                        class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2"
                                        @click.stop="GetAllData">Search</v-btn>
                                    <v-btn size="small" :loading="excelLoading" @click.stop="ExportExcel"
                                        color="success" :class="$vuetify.display.smAndDown ? 'mt-2 mr-2' : `mr-0` " variant="outlined"
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
                            <v-col :cols=" $vuetify.display.smAndDown ? 12 : 6" ><span class="text-subtitle-1 font-weight-bold"> နေ့စဉ်အော်ဒါစာရင်း(အားလုံး)
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
                                v-model:page="pagination.page"  v-model:items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">
                                <template v-slot:['item.actions']="{ item }">
                                    <v-btn rounded="lg" color="red-darken-2" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-trash-can-outline"
                                        @click.stop="ConfirmDelete(item.id)">Delete</v-btn>
                                </template>
                            </v-data-table-server>
                        </v-col>
                    </v-card-text>

                </v-card>
            </v-col>
        </v-row>
        <v-dialog persistent v-model="dateDialog">
            <v-row class="justify-start">
                <v-col cols="11">
                    <v-date-picker v-model="pagination.search.date" @update:model-value="ChangeToDate"
                        color="primary"></v-date-picker>
                </v-col>
            </v-row>
        </v-dialog>
        <UnauthorizeDialog ref="unauthorizeRef" />
        <SnackbarDialog ref="snackbarRef" />
        <ConfirmDialog ref="confirmRef" @confirm="Delete" />
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

const dateStr = ref('')

const excelLoading = ref(false)

const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const confirmRef = ref(null)
const dateDialog = ref(false)
const loading = ref(false)
const userList = ref([])
const selected_id = ref(0)
const total = ref(0)
const extra = ref(0)
 const io = inject('socket')
const pagination = ref({
    search: {
        name: '',
        number: null,
        user_id: null,
        date: new Date()
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "id", order: "desc" }],
})
const headers = [
    { title: 'Number', key: 'number', sortable: true },
    { title: 'Amount', key: 'amount', sortable: true },
    { title: 'Extra', key: 'extra', sortable: true },
    { title: 'Month', key: 'month', sortable: true },
    { title: 'From - To', key: 'from_to', sortable: false },

    { title: 'Date', key: 'date', sortable: true },
    { title: 'Create By', key: 'order_by', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
];
const recordTotal = ref(0);
const items = ref([]);

const GetAll = () => {
    loading.value = true
    dailyreportService.GetAllDetailReport(pagination.value).then((res) => {
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
const ConfirmDelete = (id) => {
    selected_id.value = id
    confirmRef.value.OpenDialog('Daily Report Delete Alert', 'Are you sure to delete this record?')
}
const Delete = (val) => {
    if (val) {
        dailyreportService.Delete(selected_id.value).then((res) => {
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            if (res.data.success) {
                GetAllData()
               io.emit('getfullnumber',"123")
            }
            snackbarRef.value.OpenSnackbar(color, message)
        }).catch((err) => {
            if (err.message == constants.UnauthorizeMessage) {
                unauthorizeRef.value.OpenDialog()
            } else {
                snackbarRef.value.OpenSnackbar('red darken-2', err.message)
            }
        }).finally(() => {

        })
    }
    selected_id.value = 0
}

const Reset = () => {
    pagination.value.search.date = new Date()
    dateStr.value = moment(pagination.value.search.date).format('DD/MM/yyyy')
    pagination.value.search.user_id = null
    pagination.value.search.number = ''
    GetAllData()
}
const GetAllData = () => {
    GetAll()
    GetDetailsTotalAmount()
}
const GetDetailsTotalAmount = () => {
    dailyreportService.GetDetailsTotalAmount(pagination.value).then((res) => {
        console.log(res.data)
        total.value = res.data.total
        extra.value = res.data.extra
    }).catch((err) => {

    }).finally(() => {

    })
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
const GetUserList = () => {
    dropdownService.GetUserList().then((res) => {
        userList.value = res.data
    }).catch((err) => {
        if (err.message == constants.UnauthorizeMessage) {
            unauthorizeRef.value.OpenDialog()
        } else {
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    }).finally(() => {

    })
}
onMounted(() => {
    pagination.value.search.date = new Date()
    dateStr.value = moment(pagination.value.search.date).format('DD/MM/yyyy')
    GetUserList()
})
</script>