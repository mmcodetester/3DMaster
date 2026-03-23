<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-text>
                    <div id="chart">
                        <apexchart type="line" height="350" :options="chartOptions" :series="series"></apexchart>
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
<script setup>
import dashboardService from '@/services/dashboard.service';
import UnauthorizeDialog from '@/components/UnauthorizeDialog.vue';
import SnackbarDialog from '@/components/SnackbarDialog.vue';
const series = ref([])
const chartOptions = ref({
    chart: {
        height: 350,
        type: 'line',
        zoom: {
            enabled: false
        }
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'straight'
    },
    title: {
        text: 'Monthly Order Compairsm This Year',
        align: 'left'
    },
    grid: {
        row: {
            colors: ['#f3f3f3', 'transparent'],
        },
    },
    xaxis: {
        categories: [],
    }
},
);
const Get = () => {
    dashboardService.GetMonthlyCompairsm().then((res) => {
        series.value = []
        series.value.push(res.data.series)
        console.log(res.data.series)
        //series.value = res.data.series
        chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
                ...chartOptions.value.xaxis,
                categories: res.data.labels
            }
        }
        
    }).catch((err) => {

    }).finally(() => {

    })
}
onMounted(() => {
    Get()
})
</script>