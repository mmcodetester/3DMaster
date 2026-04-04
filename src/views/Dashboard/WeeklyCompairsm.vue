<template>
    <v-row>
        <v-col cols="12">
            <v-card class="text-center">
                <v-card-text>
                    <v-pie :size="$vuetify.display.smAndDown ? 300 :378" title="Weekly Compairsm" legend reveal :palette="['#048BA8', '#99C24D', '#F18F01']"
                        :items="items">
                        <template v-slot:legend-text="{ item }">
                            <div class="d-flex justify-space-between align-center w-full my-1">
                                <span class="text-primary font-weight-bold">{{ item.title }}</span>
                                <span class="font-weight-bold ml-2">
                                    {{ item.value }} + {{ item.raw.extra }} = {{ item.value + (item.raw.extra ?? 0) }}
                                </span>
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