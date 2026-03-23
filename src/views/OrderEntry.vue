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
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Number <span class="text-red">*</span></p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-text-field required :rules="numberRules" v-model="model.number" readonly variant="outlined"
                                density="comfortable"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Available <span class="text-red">*</span></p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-text-field required :rules="availableRules" v-model="model.avaliable" readonly variant="outlined"
                                density="comfortable"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Amount <span class="text-red">*</span></p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-number-input required :rueles="amountRules(model.avaliable)" :min="1" :max="model.avaliable" v-model="model.amount" variant="outlined"
                                density="comfortable"></v-number-input>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" class="text-right">
                            <v-btn type="button" @click.stop="CloseDialog" size="large" prepend-icon="mdi-cancel" color="warning" class="mr-2">Cancel</v-btn>
                            <v-btn type="submit" size="large" prepend-icon="mdi-content-save-check-outline"
                                color="primary">Add</v-btn>
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup>
import Order from '@/models/order.model'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const isValid = ref(false)

const numberRules = [(v)=> !!v || 'Number is required'];

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
    model.value.number_id = data.id
    model.value.number = data.number
    model.value.avaliable = data.avaliable
    model.value.amount = 0
    dialog.value = true
}
const Save = () => {
    if (isValid.value) {
        store.AddToOrderList(model.value)
        CloseDialog()
    }
}
const CloseDialog = () => {
    model.value = new Order()
    dialog.value = false
}
defineExpose({
    OpenDialog
})
</script>