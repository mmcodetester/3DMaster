<template>
    <v-dialog persistent v-model="dialog" :width="$vuetify.display.smAndDown ? '95%' : '40%'">
        <v-toolbar color="primary">
            <v-toolbar-title>
                <v-row>
                    <v-col cols="10">
                        <p>Monthly Amount</p>
                    </v-col>
                    <v-col cols="2" class="text-right">
                        <v-icon class="mr-3" @click.stop="CloseDialog">mdi-close</v-icon>
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
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Year <span class="text-red">*</span>
                            </p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-text-field required :rules="yearRules" v-model="model.year" @click.stop="dateDialog = !dateDialog" readonly
                                variant="outlined" density="comfortable"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row :class="$vuetify.display.smAndDown ? 'mt-n3' : ''">
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 3"
                            :class="$vuetify.display.smAndDown ? 'text-left' : 'text-right'">
                            <p :class="$vuetify.display.smAndDown ? '' : 'mt-3'">Month</p>
                        </v-col>
                        <v-col :cols="$vuetify.display.smAndDown ? 12 : 8"
                            :class="$vuetify.display.smAndDown ? 'text-left mt-n2' : 'text-right'">
                            <v-autocomplete required :rules="monthRules" :items="monthList" v-model="model.month_id" item-title="month_name"
                                item-value="id" variant="outlined" density="comfortable"></v-autocomplete>
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
                            <v-number-input required :rules="amountRules" :min="1" v-model="model.amount" variant="outlined"
                                density="comfortable"></v-number-input>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" class="text-right">
                            <v-btn type="button" size="large" prepend-icon="mdi-cancel" color="warning" class="mr-2">Cancel</v-btn>
                            <v-btn type="submit" :loading="loading" size="large" prepend-icon="mdi-content-save-check-outline"
                                color="primary">Save</v-btn>
                        </v-col>
                    </v-row>
                </v-form>

            </v-card-text>
        </v-card>
    </v-dialog>
    <v-dialog persistent v-model="dateDialog">
        <v-row class="justify-center">
            <v-col :cols="$vuetify.display.smAndDown ? 11 : 4">
                <v-date-picker v-model:year="date" :show-week="false" header="Select Year" :hide-header="false"
                    type="year" view-mode="year" @update:year="ChangeDate" color="primary"></v-date-picker>
            </v-col>
        </v-row>
    </v-dialog>
    <snackbar-dialog ref="snackbarRef"/>
    <unauthorize-dialog ref="unauthorizeRef"/>
</template>
<script setup>
import MonthlyRate from '@/models/monthly.rate.model'
import dropdownService from '@/services/dropdown.service'
import service from '@/services/monthly.amount.service'
import SnackbarDialog from '@/components/SnackbarDialog.vue'
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue'
import constants from '@/utils/constants'
const emit = defineEmits(['saved'])
const snackbarRef = ref(null)
const unauthorizeRef = ref(null)
const model = ref(new MonthlyRate())
const monthList = ref([])
const isValid = ref(false)
const date = ref(new Date().getFullYear())
const dateDialog = ref(false)
const dialog = ref(false)
const loading = ref(false)
const yearRules = [(v) => !!v || 'year is required']
const monthRules = [(v) => !!v || 'month is required']
const amountRules = [(v) => !!v || 'amount is required']
const OpenDialog = (id) => {
    if(id>0){
        GetById(id)
    }
    dialog.value = true
}
const GetById = (id) =>{
    service.GetById(id).then((res)=>{
        model.value = res.data
    }).catch((err)=>{

    }).finally(()=>{

    })
}
const ChangeDate = (val) => {
    if (val) {
        date.value = val
        model.value.year = val
        dateDialog.value = !dateDialog.value
    }
}
const CloseDialog = () => {
    dialog.value = false
}

const GetMonthList = () => {
    dropdownService.GetMonthList().then((res) => {
        monthList.value = res.data
    }).catch((err) => {

    }).finally(() => {

    })
}
const Save = () =>{
    if(isValid.value){
        loading.value = true
        service.Save(model.value).then((res)=>{
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            snackbarRef.value.OpenSnackbar(color, message)
            if(res.data.success){
                dialog.value = false
                emit('saved')
            }
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
}
onMounted(() => {
    GetMonthList()
    model.value.month_id = new Date().getMonth() + 1
    date.value = new Date().getFullYear()
    model.value.year = date.value
})
defineExpose({
    OpenDialog
})
</script>