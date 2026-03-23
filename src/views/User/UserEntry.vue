<template>
    <v-dialog persistent :width="$vuetify.display.smAndDown ? '100%' : '35%'" v-model="dialog">
        <v-toolbar color="primary">
            <v-toolbar-title>
                <v-row>
                    <v-col cols="8">
                        <p class="text-subtitle-1 font-weight-bold">
                            User Entry
                        </p>
                    </v-col>
                    <v-col cols="4" class="text-right">
                        <v-icon class="mr-3" @click.stop="CloseDialog">mdi-close</v-icon>
                    </v-col>
                </v-row>
            </v-toolbar-title>
        </v-toolbar>
        <v-card :rounded="0">
            <v-card-text>
                <v-form v-model="isValid" @submit.prevent="Save">
                    <v-row class="mt-1">
                        <v-col cols="3" class="text-right">
                            Name <span class="text-red">*</span>
                        </v-col>
                        <v-col cols="8">
                            <v-text-field v-model="model.name" required :rules="nameRules" density="compact"
                                variant="outlined"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row class="mt-n5">
                        <v-col cols="3" class="text-right">
                            User Name <span class="text-red">*</span>
                        </v-col>
                        <v-col cols="8">
                            <v-text-field v-model="model.username" required :rules="usernameRules" density="compact"
                                variant="outlined"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row class="mt-n5">
                        <v-col cols="3" class="text-right">
                            Password <span class="text-red">*</span>
                        </v-col>
                        <v-col cols="8">

                            <v-text-field :readonly="model.id>0 ? true : false" :append-inner-icon="show ? `mdi-eye` : `mdi-eye-off`"
                                @click:append-inner="show = !show" :type="show ? 'text' : 'password'"
                                v-model="model.password" required :rules="passwordRules" density="compact"
                                variant="outlined"></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row class="mt-n6">
                        <v-col cols="12" class="text-right">
                            <v-btn @click.stop="CloseDialog" prepend-icon="mdi-cancel" size="small" color="warning"
                                type="button" rounded="md" class="mr-2">Cancel</v-btn>
                            <v-btn size="small" :loading="loading" prepend-icon="mdi-content-save-check-outline"
                                color="primary" type="submit" rounded="md">Save</v-btn>
                        </v-col>
                    </v-row>
                </v-form>

            </v-card-text>
        </v-card>
    </v-dialog>
    <snackbar-dialog ref="snackbarRef"/>
    
</template>
<script setup>
import User from '@/models/user.model'
import userService from '@/services/user.service'
import SnackbarDialog from '@/components/SnackbarDialog.vue'
const emit = defineEmits(["saved"])
const snackbarRef = ref(null)
const dialog = ref(false)
const roleList = ref([])
const locationList = ref([])
const loading = ref(false)
const emits = ref(['saved'])
const show = ref(false)
const isValid = ref(false)
const nameRules = [(v) => !!v || 'name is required']
const usernameRules = [(v) => !!v || 'user name is required']
const passwordRules = [
    v => !!v || 'password is required',
    v => v.length >= 8 || 'password must be at least 8 characters',
    v => /[A-Z]/.test(v) || 'password must contain an uppercase letter',
    v => /[a-z]/.test(v) || 'password must contain a lowercase letter',
    v => /[0-9]/.test(v) || 'password must contain a number',
    v => /[^A-Za-z0-9]/.test(v) || 'password must contain a special character',
]

const roleRules = [(v) => !!v || 'role is required']
const model = ref(new User())

const Save = () => {
    if (isValid.value) {
        loading.value = true
        userService.Save(model.value).then((res) => {
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            snackbarRef.value.OpenSnackbar(color, message)
            if(res.data.success){
                CloseDialog()
                emit('saved')
            }
        }).catch((err) => {

        }).finally(() => {
            loading.value = false
        })
    }
}
const OpenDialog = (id) => {
    if (id && id > 0) {
        GetById(id)
    }
    dialog.value = true
}
const GetById = (id) => {
  userService.GetById(id).then((res)=>{
        model.value = res.data
  }).catch((err)=>{

  }).finally(()=>{

  })
}
const CloseDialog = () => {
    model.value = new User()
    dialog.value = false
}

onMounted(() => {
})
defineExpose({
    OpenDialog
})
</script>