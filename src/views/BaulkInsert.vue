<template>
    <v-dialog :width="$vuetify.display.smAndDown ? '95%' : '50%'" v-model="dialog">
        <v-toolbar color="primary">
            <v-toolbar-title>
                <v-row>
                    <v-col cols="10">
                        <p>အစုလိုက်စာရင်းသွင်းခြင်း</p>
                    </v-col>
                    <v-col cols="2" class="text-right">
                        <v-icon class="mr-2" @click.stop="CloseDialog">mdi-close</v-icon>
                    </v-col>
                </v-row>
            </v-toolbar-title>
        </v-toolbar>
        <v-card :rounded="0">
            <v-card-text>
                <v-row no-gutters v-if="fullList.length == 0">
                    <v-col cols="12">
                        <p>Example</p>
                        <ul style="list-style: none; padding-left: 0;">
                            <li>112=100x100,</li>
                            <li>231=200,</li>
                        </ul>
                    </v-col>
                </v-row>
                <v-row no-gutters v-else>
                    <v-col cols="12">
                        <p class="text-red">Full List</p>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="text-red" v-for="item in fullList" :key="item.id">{{item.number}} = {{item.amount ?? 0}} <span v-if="item.extra">x</span> {{ item.extra ?? '' }},</li>
                        </ul>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12">
                        <v-textarea label="Number Amount" clearable v-model="data" row-height="25" rows="10"
                            variant="outlined" auto-grow></v-textarea>
                    </v-col>
                </v-row>
                <v-row class="mt-n3">
                    <v-col cols="12"  class="text-right">
                          <v-btn type="button" @click.stop="CloseDialog" size="large" prepend-icon="mdi-cancel"
                                color="warning" class="mr-2">Cancel</v-btn>
                            <v-btn type="button" @click.stop="Save" :disabled="!numberAmountList.length>0" :loading="saveLoading" size="large" prepend-icon="mdi-content-save-check-outline"
                                color="primary">Save</v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
    <snackbar-dialog ref="snackbarRef"/>
    <unauthorize-dialog ref="unauthorizeRef"/>
</template>
<script setup>
import { useAppStore } from '@/stores/app';
import { NumberList } from '@/models/number';
import orderService from '@/services/order.service';
import constants from '@/utils/constants';
const snackbarRef = ref(null)
const unauthorizeRef = ref(null)
const emit = defineEmits(['saved'])
const numberAmountList = ref([])
const saveLoading = ref(false)
const dialog = ref(false)
const store = useAppStore()
const data = ref('')
const fullList = ref([])
const CloseDialog = () => {
    data.value = null
    numberAmountList.value = []
    fullList.value = []
    dialog.value = false
}
const OpenDialog = () =>{
    data.value = null
    numberAmountList.value = []
    fullList.value = []
    dialog.value = true
}
watch(() => data.value, (newVal) => {
    numberAmountList.value = []
    fullList.value = []
    if (!newVal) {
        
        return;
    };

    const list = newVal.split(',');

    list.forEach((item) => {
        if (!item) return;
        const model = {
            id: null,
            number: null,
            amount: null,
            extra: null
        }
        // split number and amount
        const [number, amountPart] = item.split('=');

        if (!number || !amountPart) return;

        const cleanNumber = number.trim();
        const cleanAmount = amountPart.trim();

        model.number = cleanNumber;
        model.id = NumberList.find(x => x.number == cleanNumber).id;

        // check x or *
        if (cleanAmount.includes('x') || cleanAmount.includes('*')) {

            const [amount, extra] = cleanAmount.split(/x|\*/);

            model.amount = parseInt(amount.trim());
            model.extra = parseInt(extra.trim());

        } else {
            model.amount = parseInt(cleanAmount);
            model.extra = null;
        }
        CheckFull(model)
        numberAmountList.value.push(model)

    });
    console.log(numberAmountList.value);
});
const CheckFull = (data) =>{
   const hasFull = store.fullOrderList.filter(x=>x.id ===data.id)[0]
   if(hasFull){
    fullList.value.push(data)
   }
   console.log(fullList.value)
}
defineExpose({
    OpenDialog
})
const Save =()=>{
    saveLoading.value = true;
    orderService.BaulkSave(numberAmountList.value).then((res)=>{
        const color = res.data.success ? 'success' : 'red darken-2'
        const message = res.data.messages[0]
        emit('saved')
        snackbarRef.value.OpenSnackbar(color, message)
        if(res.data.success){
            CloseDialog()
        }
    }).catch((err)=>{
        if(err.message == constants.UnauthorizeMessage){
            unauthorizeRef.value.OpenDialog()
        }else{
            snackbarRef.value.OpenSnackbar("red darken-2", err.message)
        }
    }).finally(()=>{
        saveLoading.value = false
    })
}
</script>