<template>
  <div>
    <div
      v-for="(d, i) in config.list"
      :key="i"
      class="flex content-between pay-detail-list-item bottom-line"
      @click="emit('click-item', d)"
    >
      <div style="width: 20%" class="flex flex-center">
        <div class="circle flex flex-center">{{ shortName(d.tn) }}</div>
      </div>
      <div style="width: 60%" class="flex-column content-center">
        <div>
          {{ d.n }} {{ Number(percent(d.m)).toFixed(0) }}%
        </div>
        <van-progress
          color="#14c9a8"
          track-color="#e9f7f3"
          :percentage="percent(d.m)"
          :show-pivot="false"
          stroke-width="6"
        />
        <div v-if="config.isTime">{{ d.d }}</div>
      </div>
      <div style="width: 20%" class="flex flex-center">{{ Number(d.m / 100).toFixed(2) }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  config: { type: Object, required: true },
});
const emit = defineEmits(['click-item']);

function percent(m) {
  const sum = Number(props.config.sum) || 0;
  return sum > 0 ? (Number(m) / sum) * 100 : 0;
}
function shortName(tn) {
  return String(tn || '?').substr(0, 4);
}
</script>