<template>
    <v-dialog v-model="dialog" persistent :width="$vuetify.display.smAndDown ? '95%' : '30%'">
        <v-toolbar color="red darken-2">
            <v-toolbar-title>
                <p> <span class="mb-1 mr-2"><v-icon>mdi-alert</v-icon></span> Unauthorize</p>
            </v-toolbar-title>
        </v-toolbar>
        <v-card rounded="0">
           <v-card-text>
             <v-row>
                <v-col cols="12" class="text-center">
                    <p>Request failed with status code 401.</p>
                    <p class="mt-2 text-subtitle-1 font-weight-bold" >Login is Required.</p>
                </v-col>
            </v-row>
            <v-row class="mt-3" justify="center">
                <v-col cols="6" class="text-right">
                    <v-btn block color="warning" @click.stop="GoBackLogin">Go Back Login</v-btn>
                </v-col>
            </v-row>
           </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup>
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const router = useRouter()
const dialog = ref(false)
const GoBackLogin =()=>{
    localStorage.removeItem('user')
    router.push({name:'Login'})
}
const OpenDialog = () =>{
    dialog.value = true
}
defineExpose({
    OpenDialog
})
</script>