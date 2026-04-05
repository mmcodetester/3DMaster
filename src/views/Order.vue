<template>
    <v-col cols="12">
        <v-card elevation="10">
            <v-card-text class="mb-3">

                <v-row class="mt-7">
                    <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                        :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-btn @click.stop="BaulkCreateOpenEntry" class="mr-1" block size="large" color="primary"
                            prepend-icon="mdi-database">အစုလိုက်စာရင်းသွင်းခြင်း</v-btn>
                    </v-col>
                    <v-col :cols="$vuetify.display.smAndDown ? 12 : 9">
                        <v-text-field v-model="search" clearable density="comfortable"
                            variant="outlined"></v-text-field>
                    </v-col>

                </v-row>
                <v-row no-gutters :class="$vuetify.display.smAndDown ? 'mt-4' : ''">
                    <v-col cols="12">
                        <p class="text-subtitle-1 text-primary font-weight-bold">Numbers</p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="3" v-for="item in items">
                        <v-card @click.stop="OpenEntry(item)" :disabled="GetDisabled(item.id)"
                            :color="GetColor(item.id)" variant="outlined" class="d-flex align-center">
                            <v-card-text class="text-center">

                                <p class="font-weight-bold text-subtitle-1 mr-2">
                                    {{ item.number }}
                                </p>

                                <!-- <v-progress-linear :model-value="(item.avaliable / item.total_amount) * 100"
                                    :color="item.status == 'full' ? 'pink' : 'success'" height="20" rounded>
                                    <template v-slot:default="{ value }">
                                        <strong class="text-white">{{ Math.ceil(value) }}%</strong>
                                    </template>
</v-progress-linear> -->

                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <!-- <v-card  class="mt-2">
            <v-card-title>
                Order List
            </v-card-title>
            <v-divider class="mt-2 mb-2"></v-divider>
            <v-card-text>
                <v-table>
                    <thead>
                        <tr>
                            <th>Number</th>
                            <th>Amount</th>
                            <th class="text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="item in store.orderList.data" :key="item.id">
                            <td>{{ item.number }}</td>
                            <td>{{ item.amount }}</td>
                            <td class="text-center">
                                 <v-btn rounded="lg" color="red-darken-4" class="ml-2" size="small" variant="outlined" prepend-icon="mdi-trash-can-outline" @click.stop="store.RemoveFromOrderList(item.number_id)">Remove</v-btn>

                            </td>
                        </tr>
                        <tr v-if="store.orderList.data.length > 0">
                            <td>
                                <p class="font-weight-bold">Net Total</p>
                            </td>
                            <td>{{ store.orderList.total }}</td>
                            <td class="text-center">
                                <v-btn @click.stop="Save" :disabled="store.orderList.total == 0" :loading="saveLoading" size="small" color="primary">Save</v-btn>
                            </td>
                        </tr>
                        <tr v-if="store.orderList.data.length === 0">
                            <td colspan="3" class="text-center text-grey">
                                No orders added
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card> -->
    </v-col>
    <OrderEntry ref="entryRef" @saved="GetAllAfterSave" />
    <SnackbarDialog ref="snackbarRef" />
    <UnauthorizeDialog ref="unauthorizeRef" />
    <BaulkInsert ref="baulkInsertRef" @saved="GetAllAfterSave" />
</template>
<script setup>
import numberService from '@/services/number.service';
import BaulkInsert from './BaulkInsert.vue';
import OrderEntry from './OrderEntry.vue';
import { useAppStore } from '@/stores/app';
import orderService from '@/services/order.service';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import constants from '@/utils/constants';
import { NumberList } from '@/models/number';
import { useSocketIO } from '@hlf01/vue3-socket.io';
import VueSocketIO from '@hlf01/vue3-socket.io';
const io = inject('socket')
const store = useAppStore()
const search = ref('')
const loading = ref(false)
const entryRef = ref(null)
const baulkInsertRef = ref(null)
const saveLoading = ref(false)
const snackbarRef = ref(null)
const unauthorizeRef = ref(null)
const socket = useSocketIO()
const { proxy } = getCurrentInstance()
// const emitter = io(import.meta.env.VITE_SOCKET_URL,{
//     transports: ['websocket'],
// })
const items = ref([])
const GetAllAfterSave = () => {
    SendSocketEvent()
    items.value = []
    if (search.value) {
        items.value = NumberList.filter(x => x.number.includes(search.value))
    } else {
        items.value = NumberList
    }
}
const BaulkCreateOpenEntry = () => {
    baulkInsertRef.value.OpenDialog()
}
const GetAll = () => {
    items.value = []
    if (search.value) {
        items.value = NumberList.filter(x => x.number.includes(search.value))
    } else {
        items.value = NumberList
    }
    // numberService.GetAll(search.value).then((res) => {

    //     items.value = res.data
    // }).catch((err) => {
    //     if(err.message == constants.UnauthorizeMessage){
    //         unauthorizeRef.value.OpenDialog()
    //     }else{
    //         snackbarRef.value.OpenSnackbar('red darken-2', err.message)
    //     }
    // }).finally(() => {
    //     loading.value = false
    // })
}
const Save = () => {
    saveLoading.value = true
    orderService.Save(store.orderList).then((res) => {
        const color = res.data.success ? 'success' : 'red darken-2'
        const message = res.data.messages[0]
        snackbarRef.value.OpenSnackbar(color, message)
        if (res.data.success) {
            GetAll()
            store.orderList.total = 0
            store.orderList.data = []
        }
    }).catch((err) => {
        if (err.message == constants.UnauthorizeMessage) {
            unauthorizeRef.value.OpenDialog()
        } else {
            snackbarRef.value.OpenSnackbar('red darken-2', err.message)
        }
    }).finally(() => {
        saveLoading.value = false
    })
}
watch(() => search.value, (newVal) => {
    GetAll()
})
const OpenEntry = (data) => {
    entryRef.value.OpenDialog(data)
}
const GetColor = (id) => {
    let color = 'success'
    const hasFull = store.fullOrderList.filter(x => x.id == id)[0]
    if (hasFull) {
        color = 'red darken-2'
    }
    return color
}
const GetDisabled = (id) => {
    let disable = false
    const hasFull = store.fullOrderList.filter(x => x.id == id)[0]
    if (hasFull) {
        disable = true
    }
    return disable
}
const SendSocketEvent = () => {
    io.emit('getfullnumber', "124")
}
// watch(()=> store.fullOrderList.length, (newVal)=>{
//     if(newVal){
//       GetAll()
//     }
// })
onMounted(() => {
    store.orderList.data = []
    store.orderList.total = 0
    GetAll()
    store.fullOrderList = []
    SendSocketEvent()
    socket.subscribe('fullnumbers', (data) => {
        store.fullOrderList = []
        if (data) {
            store.SetFullOrderList(data)
        }
        store.SetFullOrderList(data)
        GetAll()
    })
})
</script>