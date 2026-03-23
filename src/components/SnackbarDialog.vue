<template>
    <v-snackbar transition="scroll-y-reverse-transition" v-model="snackbar" :color="color" location="top right"
        :timeout="timeout">
        <v-icon color="white" class="mr-2" size="25">mdi-alert-circle-outline</v-icon> {{ text }}
        <template v-slot:actions>
            <v-btn color="white" variant="text" @click="snackbar = false">
                <v-icon>mdi-close-circle</v-icon>
            </v-btn>
        </template>
    </v-snackbar>
</template>
<script setup>
import { ref } from 'vue';
var snackbar = ref(false)
var timeout = ref(3000)
var text = ref('')
var color = ref('')

const OpenSnackbar = (snackbarColor, message) =>{
    color.value = snackbarColor
    text.value = message
    snackbar.value = true
}
defineExpose({
    OpenSnackbar
})
</script>