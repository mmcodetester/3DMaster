<template>
    <v-col cols="12">
       
    <v-row>
            <v-col cols="12" sm="12" md="12">
                <v-expansion-panels>
                    <v-expansion-panel elevation="5">
                        <v-expansion-panel-title> Search </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row cols="12" justify="start" class="mt-n4">
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4`">
                                    <p class="text-body-2 mt-3">Name</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text"
                                        density="compact" v-model="pagination.search.name" variant="outlined"></v-text-field>
                                </v-col>
                                <v-col cols="12" md="6"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2" @click.stop="GetAll">Search</v-btn>
                                    <v-btn size="small" color="success" class="mr-0" variant="outlined" append-icon="mdi-file-excel">Export Excel</v-btn>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card elevation="2">
                     <v-card-title>
                        <v-icon color="primary" @click.stop="OpenEntry(0)" size="25" class="mr-2">mdi-plus-circle-outline</v-icon> <span class="text-subtitle-1 font-weight-bold"> User List</span>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-col cols="12">
                            <v-data-table-server sort-desc-icon="mdi-sort-descending" sort-asc-icon="mdi-sort-ascending"
                                :fixed-header="true" :fixed-footer="true" search="name" @update:options="GetAll"
                                :items="items" :headers="headers" :must-sort="true" :items-length="recordTotal"
                                :loading="loading" item-key="id" v-model:sort-by="pagination.sortBy"
                                :page="pagination.page" :items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">
                                <template v-slot:['item.actions']="{item}">
                                   
                                    <v-btn rounded="lg" color="grey-darken-4" class="ml-2" size="small" variant="outlined" prepend-icon="mdi-square-edit-outline" @click.stop="Edit(item.id)">Edit</v-btn>
                                    <v-btn rounded="lg" color="red-darken-2" class="ml-2" size="small" variant="outlined" prepend-icon="mdi-trash-can-outline" @click.stop="ConfirmDelete(item.id)">Delete</v-btn>

                                </template>
                            </v-data-table-server>
                        </v-col>
                    </v-card-text>

                </v-card>
            </v-col>
        </v-row>
        <UserEntry ref="entryRef" @saved="GetAll"/>
        <UnauthorizeDialog ref="unauthorizeRef"/>
        <SnackbarDialog ref="snackbarRef"/>
        <ConfirmDialog ref="confirmRef" @confirm="Delete"/>
    </v-col>
</template>
<script setup>
import UserEntry from './UserEntry.vue';
import userService from '@/services/user.service';
import constants from '@/utils/constants';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';


const entryRef = ref(null)
const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const  confirmRef = ref(null)

const loading = ref(false)

const selected_id = ref(0)
const pagination = ref({
    search:{
        name :'',
        role_id : null
    },
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "id", order: "desc" }],
})
const headers = [
    { title: 'Name', key: 'name', sortable: true },
    { title: 'User Name', key: 'username', sortable: true },
    { title: 'Join Date', key: 'join_date', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false  , align:'center'},
];
const recordTotal = ref(0);
const items = ref([]);

const GetAll=()=>{
    loading.value = true
    userService.GetAll(pagination.value).then((res)=>{
        console.log(res)
        items.value = res.data.data
        recordTotal.value = res.data.total
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

const OpenEntry = (id)=>{
    entryRef.value.OpenDialog(id)
}
const Edit = (id) =>{
    entryRef.value.OpenDialog(id)
}
const ChangeStatus = (item) =>{
    item.status = !item.status
    userService.ChangeStatus(item.id).then((res)=>{

    }).catch((err)=>{

    }).finally(()=>{

    })
}
const ConfirmDelete = (id) =>{
    selected_id.value = id
    confirmRef.value.OpenDialog('User Delete Alert', 'Are you sure to delete this record?')
}
const Delete = (val) =>{
    if(val){
        userService.Delete(selected_id.value).then((res)=>{
            const color = res.data.success ? 'success' : 'red darken-2'
            const message = res.data.messages[0]
            if(res.data.success){
                GetAll()
            }
            snackbarRef.value.OpenSnackbar(color, message)
        }).catch((err)=>{
            if(err.message == constants.UnauthorizeMessage){
                unauthorizeRef.value.OpenDialog()
            }else{
                snackbarRef.value.OpenSnackbar('red darken-2', err.message)
            }
        }).finally(()=>{

        })
    }
    selected_id.value = 0
}
watch(()=>pagination.value.search.name, (newVal)=>{
         GetAll()
    })
watch(()=>pagination.value.search.role_id , (newVal)=>{
    GetAll()
})
onMounted(()=>{
})
</script>