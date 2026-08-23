<template>
  <div class="view view-chart">
    <van-tabs v-model="chart.type" type="card" class="view-card">
      <van-tab title="周" name="week"></van-tab>
      <van-tab title="月" name="month"></van-tab>
      <van-tab title="年" name="year"></van-tab>
    </van-tabs>

    <van-tabs v-model="chart.time" class="time-tabs">
      <van-tab
        v-for="(t, i) in chart.timeList"
        :key="i"
        :title="t.title"
        :name="t.value"
      ></van-tab>
    </van-tabs>

    <div ref="chartEl" class="chart-canvas"></div>

    <div
      v-if="chart.visibleType === 'detail'"
      class="flex content-between pay-detail-list-head"
    >
      <div>支出明细排行榜·{{ chart.isBig ? '大类' : '小类' }}&ensp;总计 {{ detailSum }}</div>
      <div class="main-color-1" @click="chart.backToType()">返回</div>
    </div>
    <div v-else class="flex content-between pay-detail-list-head">
      <div>支出分类排行榜·{{ chart.isBig ? '大类' : '小类' }}&ensp;总计 {{ typeSum }}</div>
      <van-switch
        v-model="chart.isBig"
        size="20"
        active-color="#14c9a8"
        inactive-color="#e9f7f3"
      />
    </div>

    <van-pull-refresh
      v-model="ui.refreshing"
      @refresh="chart.showDetail()"
      class="view-scroll chart-list"
    >
      <van-empty v-if="currentConfig.list.length === 0" description="本周期暂无支出" />
      <transition :name="'van-slide-right'" mode="out-in">
        <PayDetailList :key="listKey" :config="currentConfig" @click-item="chart.selectEntry" />
      </transition>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import { chart, ui } from '@/store';
import PayDetailList from '@/components/PayDetailList.vue';

const chartEl = ref(null);
let chartInstance = null;

const currentConfig = computed(() =>
  chart.visibleType === 'detail'
    ? chart.detailConfig
    : chart.isBig
      ? chart.bigTypeConfig
      : chart.smallTypeConfig,
);
const listKey = computed(() => chart.visibleType + '-' + chart.isBig);
const detailSum = computed(() => (chart.detailConfig.sum / 100).toFixed(2));
const typeSum = computed(() =>
  ((chart.isBig ? chart.bigTypeConfig.sum : chart.smallTypeConfig.sum) / 100).toFixed(2),
);

function renderChart() {
  if (!chartInstance) return;
  const source = chart.genChartSource();
  const dates = source.map(e => e.groupshow);
  const values = source.map(e => Number(Number(e.m / 100).toFixed(2)));
  chartInstance.setOption(
    {
      tooltip: { trigger: 'axis' },
      grid: { left: 10, right: 10, top: 14, bottom: 6, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#c2d9d3' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#7f8f8b' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#eef3f1' } },
        axisLabel: { fontSize: 10, color: '#aabbb6' },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: values,
          lineStyle: { color: '#14c9a8', width: 3 },
          itemStyle: { color: '#14c9a8' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(20, 201, 168, 0.28)' },
                { offset: 1, color: 'rgba(20, 201, 168, 0.02)' },
              ],
            },
          },
        },
      ],
    },
    true,
  );
}

function handleResize() {
  if (chartInstance) chartInstance.resize();
}

// type 切换 → 重建时间列表
watch(() => chart.type, () => {
  chart.buildTimeList();
  renderChart();
});

// 时间段切换 → 拉取明细并聚合
watch(() => chart.time, () => {
  chart.showDetail();
});

// 明细/聚合数据变化 → 联动明细列表与图表
watch(
  () => [chart.visibleType, chart.isBig, chart.detailList],
  () => {
    if (chart.visibleType === 'detail' && chart.selectTypeId) {
      chart.initDetailList(chart.detailList, chart.selectTypeId);
    }
    renderChart();
  },
);

onMounted(() => {
  chartInstance = echarts.init(chartEl.value);
  if (chart.timeList.length === 0) chart.buildTimeList();
  else renderChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.chart-canvas {
  width: 100%;
  height: 130px;
  margin: 4px 0 8px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}
.time-tabs {
  margin: 0 12px;
}
.time-tabs :deep(.van-tab) {
  font-size: 12px;
}
</style>