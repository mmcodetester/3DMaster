<template>
    <v-dialog :width="$vuetify.display.smAndDown? '100%':'30%'" v-model="dialog" persistent>
        <v-card>
        <v-toolbar dark color="warning" dense flat>
            <v-toolbar-title class="text-body-2 font-weight-bold" color="warning">
                <span><v-icon>mdi-alert-circle-outline</v-icon></span>  {{ alertTitle }}
            </v-toolbar-title>
        </v-toolbar>
        <v-card-text>
            <p class=" mt-1 text-subtitle-1 font-weight-bold">{{ alertMessage }}</p>
        </v-card-text>
        <v-card-actions class="text-right mt-n3">
            <v-col cols="12" md="12" class="text-right">
                <v-btn class="ml-2" dark variant="outlined" color="warning" @click.stop="CancelClick()"
                size="small">Cancel</v-btn>
                <v-btn class="ml-2" dark variant="outlined" color="primary" @click.stop="OKClick()"
                size="small">OK</v-btn>
            </v-col>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>
<script setup>
import { ref } from 'vue';
const dialog = ref(false)
const emit = defineEmits('confirm')
const alertMessage = ref('')
const alertTitle = ref('')
const CancelClick = () =>{
    dialog.value = false
    emit('confirm', false)
}
const OKClick = () =>{
    dialog.value = false
    emit('confirm', true)
}
const OpenDialog = (title, message) =>{
    dialog.value = true
    alertTitle.value = title,
    alertMessage.value = message
}
defineExpose({
    OpenDialog
})
</script>