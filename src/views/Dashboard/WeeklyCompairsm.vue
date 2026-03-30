<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-text>
                    <v-pie title="Weekly Compairsm" legend reveal :palette="['#048BA8', '#99C24D', '#F18F01']"
                        :items="items">
                        <template v-slot:legend-text="{ item }">
                            <div class="d-flex ga-6">
                                <div>{{ item.title }}</div>

                                <div class="ml-auto font-weight-bold">
                                    {{ item.value }}
                                </div>
                            </div>
                        </template>
                    </v-pie>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
<script setup>
import weeklyamountperuserService from '@/services/report/weeklyamountperuser.service';
const items = ref([])
const Get = () => {
    weeklyamountperuserService.GetCompairsm().then((res) => {
        console.log(res)
        items.value = res.data
    }).catch((err) => {

    }).finally(() => {

    })
}
onMounted(() => {
    Get()
})
</script>