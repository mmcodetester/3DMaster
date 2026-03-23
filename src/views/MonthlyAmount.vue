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
                                    <p class="text-body-2 mt-3">Date (From)</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text" density="compact" variant="outlined"></v-text-field>
                                </v-col>
                                <v-col cols="12" md="2"
                                    :class="$vuetify.display.mdAndUp ? `text-right` : `text-left mb-n4 mt-n8`">
                                    <p class="text-body-2 mt-3">Date (To)</p>
                                </v-col>
                                <v-col cols="12" md="4" align-self="center"
                                    :class="$vuetify.display.mdAndUp ? `mb-0` : `mb-n0`">
                                    <v-text-field type="text" density="compact" variant="outlined"></v-text-field>
                                </v-col>
                            </v-row>
                            <v-row cols="12" justify="start" class="mt-n4">

                                <v-col cols="12" md="12"
                                    :class="$vuetify.display.mdAndUp ? `text-right mt-3` : `text-right mt-n4`">
                                    <v-btn size="small" color="red darken-2" class="mr-2">Reset</v-btn>
                                    <v-btn size="small" color="success" class="mr-2">Search</v-btn>
                                    <v-btn size="small" color="success" class="mr-0" variant="outlined"
                                        append-icon="mdi-file-excel">Export Excel</v-btn>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card elevation="10">
                    <v-card-title>
                        <v-icon color="primary" @click.stop="OpenEntry(0)" size="25"
                            class="mr-2">mdi-plus-circle-outline</v-icon> <span
                            class="text-subtitle-1 font-weight-bold"> Monthly Amount List</span>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-col cols="12">
                            <v-data-table-server sort-desc-icon="mdi-sort-descending" sort-asc-icon="mdi-sort-ascending"
                                :fixed-header="true" :fixed-footer="true" search="name" @update:options="GetAll"
                                :items="items" :headers="headers" :must-sort="true" :items-length="recordTotal"
                                :loading="loading" item-key="id" v-model:sort-by="pagination.sortBy"
                                v-model:page="pagination.page" :items-per-page="pagination.itemsPerPage"
                                initial-sort-order="desc">
                                <template v-slot:['item.actions']="{ item }">

                                    <v-btn rounded="lg" color="grey-darken-4" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-square-edit-outline"
                                        @click.stop="OpenEntry(item.id)">Edit</v-btn>
                                    <v-btn rounded="lg" color="red-darken-2" class="ml-2" size="small"
                                        variant="outlined" prepend-icon="mdi-trash-can-outline">Delete</v-btn>
                                </template>
                            </v-data-table-server>
                        </v-col>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-col>
    <MonthlyAmountEntry ref="entryRef" @saved="GetAll" />
    <UnauthorizeDialog ref="unauthorizeRef" />
    <SnackbarDialog ref="snackbarRef" />
    <ConfirmDialog ref="confirmRef" @confirm="Delete" />
</template>
<script setup>
import MonthlyAmountEntry from './MonthlyAmountEntry.vue';
import service from '@/services/monthly.amount.service'
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import constants from '@/utils/constants';
const entryRef = ref(null)
const unauthorizeRef = ref(null)
const snackbarRef = ref(null)
const  confirmRef = ref(null)
const loading = ref(false)
const pagination = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [{ key: "id", order: "desc" }],
})
watch(() => pagination.value.sortBy, (newVal) => {
    console.log('sort by changed', newVal);
}, { deep: true });
const headers = [
    { title: 'Year ', key: 'year', sortable: true },
    { title: 'Month', key: 'month_name', sortable: true },
    { title: 'Amount', key: 'amount', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center', minWidth: '230' },
];
const recordTotal = ref(0);
const items = ref([]);

const OpenEntry = (id) => {
    entryRef.value.OpenDialog(id)
}
const GetAll = () => {
    loading.value = true
    service.GetAll(pagination.value).then((res) => {
        items.value = res.data.data
        recordTotal.value = res.data.total
    }).catch((err) => {
         if(err.message == constants.UnauthorizeMessage){
            unauthorizeRef.value.OpenDialog()
       }else{
        snackbarRef.value.OpenSnackbar('red darken-2', err.message)
       }
       
    }).finally(() => {
        loading.value = false
    })
}
const Delete = (id) => {

}
const ConfirmDelete = (id) =>{

}
</script>