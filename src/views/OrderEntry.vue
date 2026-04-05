<template>
    <v-dialog persistent v-model="dialog" :width="$vuetify.display.smAndDown ? '95%' : '40%'">
        <v-toolbar color="primary">
            <v-toolbar-title>
                <v-row>
                    <v-col cols="10">
                        <p>Order</p>
                    </v-col>
                    <v-col cols="2" class="text-right">
                        <v-icon class="mr-2" @click.stop="CloseDialog">mdi-close</v-icon>
                    </v-col>
                </v-row>
            </v-toolbar-title>
        </v-toolbar>
        <v-card :rounded="0">
            <v-card-text>
                <v-form v-model="isValid" @submit.prevent="Save">
                    <v-row class="mt-2">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Number <span class="text-red">*</span>
                            </p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-text-field required :rules="numberRules" v-model="model.number" readonly class="font-weight-bold"
                                variant="outlined" density="comfortable"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Available <span
                                    class="text-red">*</span></p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-text-field required :rules="availableRules" v-model="model.avaliable" readonly class="font-weight-bold"
                                variant="outlined" density="comfortable"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Amount <span class="text-red">*</span>
                            </p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-number-input :readonly="!model.avaliable" required :rueles="amountRules(model.avaliable)"  class="font-weight-bold"
                                :max="model.avaliable" v-model="model.amount" variant="outlined"
                                density="comfortable"></v-number-input>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Extra Amount 
                            </p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-number-input  class="font-weight-bold" prepend-inner-icon="mdi-close"
                                v-model="model.extra" variant="outlined"
                                density="comfortable"></v-number-input>
                        </v-col>
                    </v-row>
                    <v-row class="mt-n5">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 11" class="text-right" >
                            <v-btn type="button" @click.stop="CloseDialog" size="large" prepend-icon="mdi-cancel"
                                color="warning" class="mr-2">Cancel</v-btn>
                            <v-btn type="submit" :loading="saveLoading" size="large" prepend-icon="mdi-content-save-check-outline"
                                color="primary">Save</v-btn>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
    <snackbar-dialog ref="snackbarRef"/>
    <unauthorize-dialog ref="unauthorizeRef"/>
</template>
<script setup>
import Order from '@/models/order.model'
import orderService from '@/services/order.service'
import { useAppStore } from '@/stores/app'
import constants from '@/utils/constants'
const emit = defineEmits(['saved'])
const hasExtra = ref(true)
const unauthorizeRef = ref(null)
const snackbarRef = ref(null)

const store = useAppStore()
const isValid = ref(false)
const saveLoading = ref(false)

const numberRules = [(v) => !!v || 'Number is required'];

const availableRules = [
    v => !!v || 'Available is required',
    v => v > 0 || 'Available must be greater than 0'
];
const amountRules = (available) => [
    v => !!v || 'Amount is required',
    v => v <= available || 'Amount cannot be greater than available'
];
const dialog = ref(false)
const model = ref(new Order())
const OpenDialog = (data) => {
    model.value.avaliable = null
    GetAvailable(data.id)
    model.value.number_id = data.id
    model.value.number = data.number
    //
    model.value.amount = null
    dialog.value = true
}
const GetAvailable = (id) =>{
    orderService.GetAvailable(id).then((res)=>{
        model.value.avaliable = res.data
    }).catch((err)=>{

    }).finally(()=>{

    })
}
const Save = () => {
    if (isValid.value) {
        if (model.value.avaliable >= model.value.amount) {
            saveLoading.value = true
            if(!hasExtra.value){
                model.value.extra = 0
            }
            store.orderList.total = model.value.amount
            store.orderList.data = []
            store.orderList.data.push(model.value)
            orderService.Save(store.orderList).then((res) => {
                const color = res.data.success ? 'success' : 'red darken-2'
                const message = res.data.messages[0]
                snackbarRef.value.OpenSnackbar(color, message)
                if (res.data.success) {
                    emit('saved')
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
                CloseDialog()
            })
        }
    }
}
const CloseDialog = () => {
    hasExtra.value = false
    model.value = new Order()
    store.orderList.total = 0
    store.orderList.data = []
    dialog.value = false
}
defineExpose({
    OpenDialog
})
</script>