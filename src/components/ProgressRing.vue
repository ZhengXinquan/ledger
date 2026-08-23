<template>
  <div class="progress-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="trackColor"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
      />
    </svg>
    <div class="progress-ring-text">{{ percent }}%</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  percent: { type: Number, default: 0 },
  size: { type: Number, default: 60 },
  color: { type: String, default: '#14c9a8' },
  trackColor: { type: String, default: '#e9f7f3' },
  strokeWidth: { type: Number, default: 6 },
});

const radius = computed(() => Math.max(props.size / 2 - props.strokeWidth, 8));
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => {
  const p = Math.min(Math.max(Number(props.percent) || 0, 0), 100);
  return circumference.value * (1 - p / 100);
});
</script>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-block;
}
.progress-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-main);
}
</style>