<template>
    <v-container wids="100%" height="100%" class="d-flex justify-center align-center">
        <v-row class="justify-center mt-6">
            <v-col :cols="$vuetify.display.mdAndUp ? 5 : 10">
                <v-card :elevation="10">
                    <v-card-text>
                        <v-row class="justify-center">
                            <v-col cols="4" class="text-center align-center">
                                <v-img height="100" src="@/assets/logo.jpg" width="120"></v-img>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" class="text-center mt-n3">
                                <h2 class="text-primary font-weight-bold">{{appName}}</h2>
                            </v-col>
                        </v-row>
                        <v-row class="justify-center">
                            <v-col cols="10">
                                <v-text-field prepend-inner-icon="mdi-account-outline" v-model="user.username"
                                    variant="outlined" type="text" label="username" required></v-text-field>
                            </v-col>
                            <v-col cols="10" class="mt-n3">
                                <v-text-field v-model="user.password"
                                    :append-inner-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
                                    :type="show ? 'text' : 'password'" dense label="password"
                                    prepend-inner-icon="mdi-lock-outline" @click:append-inner="show = !show"
                                    variant="outlined" v-on:keyup.enter="Login"></v-text-field>
                            </v-col>
                            <v-col cols="10" class="text-center mt-n3 mb-8">
                                <v-btn color="primary" :loading="loading" @click="Login" block>Login</v-btn>
                            </v-col>

                        </v-row>
                        
                    </v-card-text>

                </v-card>
            </v-col>
        </v-row>

    </v-container>
    <SnackbarDialog ref="snackbarRef" />
</template>
<script setup>
import authService from '@/services/auth.service'
import SnackbarDialog from '@/components/SnackbarDialog.vue';
const snackbarRef = ref(null)
const loading = ref(false)
const appName = ref('3D Note')
const router = useRouter()
const show = ref(false)
const user = ref({
    username:'',
    password:''
})
const Login = () =>{
    loading.value = true
    authService.Login(user.value).then((res)=>{
        if(res.success){
            router.push({name:'Home'})
        }else{
            const color = 'red darken-2'
            const message = res.messages[0]
            snackbarRef.value.OpenSnackbar(color, message)
        }
    }).catch((err)=>{

    }).finally(()=>{
        loading.value = false
    })
}
</script>