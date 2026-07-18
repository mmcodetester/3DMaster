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
                    <v-col cols="8">
                        <p>Example</p>
                        <ul style="list-style: none; padding-left: 0;">
                            <li>123=100R20,</li>
                            <li>112=100*100,</li>
                            <li>231=200,</li>
                        </ul>
                    </v-col>
                     <v-col cols="4">
                        <p>Total</p>
                        <p>{{ total }}</p>
                    </v-col>
                </v-row>
                <v-row no-gutters v-else>
                    <v-col cols="8">
                        <p class="text-red">Full List</p>
                        <ul style="list-style: none; padding-left: 0;">
                            <li class="text-red" v-for="item in fullList" :key="item.id">{{item.number}} = {{item.amount ?? 0}} <span v-if="item.extra">x</span> {{ item.extra ?? '' }},</li>
                        </ul>
                    </v-col>

                      <v-col cols="4">
                        <p>Total</p>
                        <p>{{ total }}</p>
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
var total = ref(0)
const CloseDialog = () => {
    total.value = 0
    data.value = null
    numberAmountList.value = []
    fullList.value = []
    dialog.value = false
}
const OpenDialog = () =>{
    total.value = 0
    data.value = null
    numberAmountList.value = []
    fullList.value = []
    dialog.value = true
}
// watch(() => data.value, (newVal) => {
//     numberAmountList.value = []
//     fullList.value = []
//     if (!newVal) {
        
//         return;
//     };

//     const list = newVal.split(',');

//     list.forEach((item) => {
//         if (!item) return;
//         const model = {
//             id: null,
//             number: null,
//             amount: null,
//             extra: null
//         }
//         // split number and amount
//         const [number, amountPart] = item.split('=');

//         if (!number || !amountPart) return;

//         const cleanNumber = number.trim();
//         const cleanAmount = amountPart.trim();

//         model.number = cleanNumber;
//         model.id = NumberList.find(x => x.number == cleanNumber).id;

//         // check x or *
//         if (cleanAmount.includes('x') || cleanAmount.includes('*')) {

//             const [amount, extra] = cleanAmount.split(/x|\*/);

//             model.amount = parseInt(amount.trim());
//             model.extra = parseInt(extra.trim());

//         } else {
//             model.amount = parseInt(cleanAmount);
//             model.extra = null;
//         }
//         CheckFull(model)
//         numberAmountList.value.push(model)

//     });
//     console.log(numberAmountList.value);
// });
// Helper function to generate unique permutations of a string (e.g., "223" -> ["223", "232", "322"])
// Helper function to generate unique permutations
const getPermutations = (str) => {
    if (str.length <= 1) return [str];
    const permutations = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const remainingChars = str.slice(0, i) + str.slice(i + 1);
        for (const subPerm of getPermutations(remainingChars)) {
            permutations.push(char + subPerm);
        }
    }
    return [...new Set(permutations)];
};

watch(() => data.value, (newVal) => {
    numberAmountList.value = [];
    fullList.value = [];
    
    if (!newVal) return;

    const list = newVal.split(',');

    list.forEach((item) => {
        if (!item) return;

        const [numberPart, amountPart] = item.split('=');
        if (!numberPart || !amountPart) return;

        const cleanNumber = numberPart.trim();
        const cleanAmount = amountPart.trim().toUpperCase();

        // 1. Case: R Permutation Logic (e.g., 123=100R20)
        if (cleanAmount.includes('R')) {
            const [baseAmountStr, permAmountStr] = cleanAmount.split('R');
            const baseAmount = parseInt(baseAmountStr.trim());
            const permAmount = parseInt(permAmountStr.trim());
            
            // Get all unique permutations (e.g., ["123", "132", "213", ...])
            const allPermutations = getPermutations(cleanNumber);

            allPermutations.forEach((num) => {
                const matchedItem = NumberList.find(x => x.number == num);
                const matchedId = matchedItem ? matchedItem.id : null;

                // Rule: Original gets baseAmount, others get permAmount. Both have extra = 0.
                const isOriginalNumber = (num === cleanNumber);

                const model = {
                    id: matchedId,
                    number: num,
                    amount: isOriginalNumber ? baseAmount : permAmount,
                    extra: 0 
                };

                CheckFull(model);
                numberAmountList.value.push(model);
            });
        } 
        // 2. Case: Standard multipliers (e.g., 123=100*200)
        else if (cleanAmount.includes('X') || cleanAmount.includes('*')) {
            const [amount, extra] = cleanAmount.split(/X|\*/);
            
            const matchedItem = NumberList.find(x => x.number == cleanNumber);
            const matchedId = matchedItem ? matchedItem.id : null;

            const model = {
                id: matchedId,
                number: cleanNumber,
                amount: parseInt(amount.trim()),
                extra: parseInt(extra.trim()) 
            };

            CheckFull(model);
            numberAmountList.value.push(model);
        } 
        // 3. Case: Plain numbers (e.g., 123=100)
        else {
            const matchedItem = NumberList.find(x => x.number == cleanNumber);
            const matchedId = matchedItem ? matchedItem.id : null;

            const model = {
                id: matchedId,
                number: cleanNumber,
                amount: parseInt(cleanAmount),
                extra: null
            };

            CheckFull(model);
            numberAmountList.value.push(model);
        }
    });
    total.value = 0
    numberAmountList.value.forEach((e)=>{
        
        total.value += e.amount + e.extra
        console.log(total.value)
    })
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