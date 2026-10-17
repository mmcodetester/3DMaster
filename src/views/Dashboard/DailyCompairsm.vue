<template>
    <v-row>
        <v-col cols="12">
            <v-card>
                <v-card-text>
                    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-3">{{ errorMessage }}</v-alert>
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

const series = ref([])
const errorMessage = ref('')
const chartOptions = ref({
    chart: {
        height: 350,
        type: 'line',
        zoom: {
            enabled: false
        }
    },
    colors: ['#1976d2', '#ef8b24'],
    legend: { show: true, position: 'top' },
    markers: { size: 3 },
    tooltip: { shared: true, intersect: false },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'straight'
    },
    title: {
        text: 'Daily Order Comparison This Month',
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
    errorMessage.value = ''
    dashboardService.GetDailyCompairsm().then((res) => {
        series.value = res.data.series
        chartOptions.value = {
            ...chartOptions.value,
            xaxis: {
                ...chartOptions.value.xaxis,
                categories: res.data.labels
            }
        }
        
    }).catch(() => {
        series.value = []
        errorMessage.value = 'Daily order comparison could not be loaded. Please try again.'
    })
}
onMounted(() => {
    Get()
})
</script>