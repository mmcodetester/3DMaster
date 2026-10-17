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
                                        variant="outlined" />
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
                                <v-col cols="12" md="4">
                                    <v-text-field v-model="pagination.search.number" density="compact"
                                        variant="outlined"></v-text-field>
                                </v-col>

                                <v-col cols="12" md="6"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" @click.stop="Reset"
                                        class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2"
                                        @click.stop="GetAllData">Search</v-btn>
                                    <!-- <v-btn size="small" :loading="excelLoading" @click.stop="ExportExcel"
                                        color="success" class="mr-0" variant="outlined"
                                        append-icon="mdi-file-excel">Export Excel</v-btn> -->
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
                            <v-col :cols="$vuetify.display.smAndDown ? 12 : 6"><span
                                    class="text-subtitle-1 font-weight-bold"> ဒိုင်ကြီးထံမတင်ရသေးသောစာရင်း
                                </span></v-col>
                            <v-col cols="12" md="6" class="d-flex flex-wrap ga-2 justify-end align-center">
                                <v-btn color="primary" prepend-icon="mdi-content-copy" :loading="copyLoading"
                                    :disabled="loading || submitting || selectLoading" @click="CopyAll">Copy All</v-btn>
                                <v-btn color="success" prepend-icon="mdi-check-all" :loading="submitting"
                                    :disabled="!selectedIds.length || loading || selectLoading" @click="ConfirmSelected">
                                    ရွေးချယ်ထားသည်များကို တင်မည် ({{ selectedIds.length }})
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12">
                                <v-btn variant="outlined" color="primary" size="small" :loading="selectLoading"
                                :disabled="loading || submitting || copyLoading || !recordTotal" @click="SelectAllMatching">
                                အားလုံးရွေးမည်
                            </v-btn>
                            <v-btn variant="text" size="small" :disabled="!selectedIds.length || submitting || selectLoading"
                                @click="selectedIds = []">ရွေးထားသည်များရှင်းမည်</v-btn>
                            </v-col>
                        </v-row>
                        <v-col cols="12">
                            <v-data-table-server v-model="selectedIds" show-select item-value="id" select-strategy="page"
                                :item-selectable="canSelectOrder" sort-desc-icon="mdi-sort-descending" sort-asc-icon="mdi-sort-ascending"
                                :fixed-header="true" :fixed-footer="true" search="name" @update:options="GetAllData"
                                :items="items" :headers="headers" :must-sort="true" :items-length="recordTotal"
                                :loading="loading" item-key="id" v-model:sort-by="pagination.sortBy"
                                v-model:page="pagination.page" :items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">
                                <template v-slot:['item.actions']="{ item }">

                                    <v-btn rounded="lg" color="success" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-check-circle-outline"
                                        :disabled="submitting || selectLoading" @click.stop="Edit(item.id)">ဒိုင်ကြီးတင်မည်</v-btn>
                                   

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
        <v-dialog v-model="copyDialog" max-width="560">
            <v-card title="စာရင်းကူးယူရန်">
                <v-card-text>
                    <p class="mb-3">အလိုအလျောက် ကူးမရပါက အောက်ပါစာသားကို ရွေးပြီး ကူးယူနိုင်ပါတယ်။</p>
                    <v-textarea :model-value="copyContent" readonly variant="outlined" rows="8" hide-details
                        aria-label="Copy all unsubmitted orders" @focus="$event.target.select()" />
                </v-card-text>
                <v-card-actions><v-btn @click="copyDialog = false">Close</v-btn><v-spacer />
                    <v-btn color="primary" prepend-icon="mdi-content-copy" @click="CopyPreparedText">Copy</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <UnauthorizeDialog ref="unauthorizeRef" />
        <SnackbarDialog ref="snackbarRef" />
        <ConfirmDialog ref="confirmRef" confirm-text="အတည်ပြုပြီး တင်မည်" cancel-text="မတင်တော့ပါ" @confirm="Confirm"/>
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
import otherorderService from '@/services/report/otherorder.service';
import { formatUnsubmittedOrders } from '@/utils/unsubmitted-copy.js';
import { copyText } from '@/utils/clipboard.js';


const copyLoading = ref(false)
const copyDialog = ref(false)
const copyContent = ref('')
const CopyPreparedText = async () => {
    try {
        await copyText(copyContent.value)
        copyDialog.value = false
        snackbarRef.value.OpenSnackbar('success', 'စာရင်းအားလုံး ကူးယူပြီးပါပြီ။')
    } catch {
        copyDialog.value = true
    }
}
const CopyAll = async () => {
    if (copyLoading.value) return
    copyLoading.value = true
    try {
        const params = JSON.parse(JSON.stringify(pagination.value))
        params.page = 1
        params.itemsPerPage = -1
        const res = await otherorderService.GetAllUnOrder(params)
        if (!Array.isArray(res.data.data) || res.data.data.length !== Number(res.data.total)) {
            throw new Error('စာရင်းအပြည့်အစုံ မရရှိသဖြင့် ပြန်လည်ကြိုးစားပါ။')
        }
        copyContent.value = formatUnsubmittedOrders(res.data.data)
        if (!copyContent.value) {
            snackbarRef.value.OpenSnackbar('warning', 'ကူးယူရန် စာရင်းမရှိပါ။')
            return
        }
        await CopyPreparedText()
    } catch (err) {
        if (err.response?.status !== 401 && err.code !== 'ERR_CANCELED') {
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    } finally {
        copyLoading.value = false
    }
}

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
const selectedIds = ref([])
const pendingIds = ref([])
const submitting = ref(false)
const selectLoading = ref(false)
const canSelectOrder = () => !submitting.value && !selectLoading.value
const pagination = ref({
    search: {
        name: '',
        role_id: null,
        year: new Date().getFullYear(),
        monthly_amount_id: null,
        number: null,
        date: new Date()
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "number", order: "desc" }],
})
const headers = [
    { title: 'Actions', key: 'actions', sortable: true },
    { title: 'Number', key: 'number', sortable: true },
    { title: 'Total Amount', key: 'total_amount', sortable: true },
    { title: 'User', key: 'username', sortable: true },
    { title: 'Year', key: 'year', sortable: false },
    { title: 'Month', key: 'month_name', sortable: false },
    { title: 'From To', key: 'from_to', sortable: true },
];
const recordTotal = ref(0);
const items = ref([]);
const GetAllData = () => {
   // GetDetailsTotalAmount()
    GetAll()
}
const SelectAllMatching = async () => {
    if (selectLoading.value || submitting.value) return
    selectLoading.value = true
    const filters = JSON.stringify(pagination.value.search)
    try {
        const params = JSON.parse(JSON.stringify(pagination.value))
        params.page = 1
        params.itemsPerPage = -1
        const res = await otherorderService.GetAllUnOrder(params)
        if (JSON.stringify(pagination.value.search) !== filters) return
        if (!Array.isArray(res.data.data) || res.data.data.length !== Number(res.data.total)) {
            throw new Error('စာရင်းအပြည့်အစုံ မရရှိသဖြင့် ပြန်လည်ကြိုးစားပါ။')
        }
        selectedIds.value = [...new Set(res.data.data.map(row => row.id))]
    } catch (err) {
        if (err.response?.status !== 401 && err.code !== 'ERR_CANCELED') {
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    } finally {
        selectLoading.value = false
    }
}
const ConfirmSelected = () => {
    if (!selectedIds.value.length || submitting.value) return
    pendingIds.value = [...selectedIds.value]
    confirmRef.value.OpenDialog('ဒိုင်ကြီးထံတင်ရန်', `ရွေးထားသောစာရင်း ${pendingIds.value.length} ခုကို ဒိုင်ကြီးထံတင်မည် သေချာပါသလား?`)
}
const Confirm = async (confirmed) => {
    const ids = [...pendingIds.value]
    pendingIds.value = []
    if (confirmed !== true || !ids.length || submitting.value) return
    submitting.value = true
    try {
        const res = await otherorderService.ConfirmOrders(ids)
        if (!res.data.success) throw new Error(res.data.messages?.[0] || 'စာရင်းတင်ခြင်း မအောင်မြင်ပါ။')
        selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
        snackbarRef.value.OpenSnackbar('success', res.data.messages[0])
        await GetAll()
    } catch (err) {
        if (err.response?.status !== 401 && err.code !== 'ERR_CANCELED') {
            snackbarRef.value.OpenSnackbar('red darken-2', err.response?.data?.messages?.[0] || err.message)
        }
    } finally {
        submitting.value = false
    }
}
const Edit = id => {
    if (submitting.value) return
    pendingIds.value = [id]
    confirmRef.value.OpenDialog('ဒိုင်ကြီးထံတင်ရန်', 'ဤစာရင်းကို ဒိုင်ကြီးထံတင်မည် သေချာပါသလား?')
}
watch(() => pagination.value.search, () => {
    selectedIds.value = []
}, { deep: true })
const GetAll = () => {
    loading.value = true
    return otherorderService.GetAllUnOrder(pagination.value).then((res) => {
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
        //GetDetailsTotalAmount()
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
// const ExportExcel = () => {
//     excelLoading.value = true

//     weeklyamountperuserService.ExportExcel(pagination.value)
//         .then((res) => {
//             if (res) {
//                 const blob = new Blob([res.data], {
//                     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//                 })

//                 const url = window.URL.createObjectURL(blob)
//                 const a = document.createElement("a")
//                 a.href = url

//                 const date = moment().format("DD-MM-YYYY_HH-mm")
//                 a.download = `detail_report_${date}.xlsx`

//                 document.body.appendChild(a)
//                 a.click()
//                 a.remove()
//                 window.URL.revokeObjectURL(url)
//             }
//         })
//         .catch((err) => {
//             if (err.message == constants.UnauthorizeMessage) {
//                 unauthorizeRef.value.OpenDialog()
//             } else {
//                 snackbarRef.value.OpenSnackbar('red darken-2', err.message)
//             }
//         })
//         .finally(() => {
//             excelLoading.value = false
//         })
// }
const GetDetailsTotalAmount = () => {
    otherorderService.GetTotal(pagination.value).then((res) => {
        console.log(res.data)
        total.value = res.data.total
        extra.value = res.data.extra
    }).catch((err) => {

    }).finally(() => {

    })
}
watch(() => pagination.value.search.year, (newVal) => {
    if (newVal) {
        GetWeeklyAmountList(newVal)
    }
})
const GetWeeklyAmountList = (year) => {
    dropdownService.GetWeeklyAmountList(year).then((res) => {
        weeklyList.value = res.data
        if (pagination.value.search.monthly_amount_id) {
            pagination.value.search.monthly_amount_id = null
        }
    }).catch((err) => {

    }).finally(() => {

    })
}
const GetInitialWeeklyAmountList = (year) => {
    dropdownService.GetWeeklyAmountList(year).then((res) => {
        weeklyList.value = res.data

        const filter = res.data.filter(x => x.status)[0]
        if (filter) {
            console.log('initital')
            pagination.value.search.monthly_amount_id = filter.id
        }else{
            pagination.value.search.monthly_amount_id  = res.data[0].id
            GetAllData()
        }
    }).catch((err) => {

    }).finally(() => {

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
    pagination.value.search.year = new Date().getFullYear()
    GetInitialWeeklyAmountList(pagination.value.search.year)
    // GetUserList()
})
</script>