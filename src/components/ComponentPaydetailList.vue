<template>
  <div>
    <div
      @click="onClick(d)"
      v-for="(d, i) in config.list"
      :key="i"
      class="flex content-between pay-detail-list-item bottom-line"
    >
      <div style="width: 20%" class="flex flex-center">
        <div class="circle flex flex-center">{{ d.tn.substr(0, 4) }}</div>
      </div>

      <div style="width: 60%" class="flex-column content-center">
        <div>{{ d.n }} {{ Number((d.m / config.sum) * 100).toFixed(0) }}%</div>
        <van-progress
          color="#FF9966"
          track-color="#99CC99"
          :percentage="(d.m / config.sum) * 100"
          :show-pivot="false"
        />
        <div v-if="config.isTime">{{ d.d }}</div>
      </div>

      <div style="width: 20%" class="flex flex-center">{{ Number(d.m / 100).toFixed(2) }}</div>
    </div>
  </div>
</template>

<script>
import { http, DEFAULT_SEARCH } from './utils';
var clientHeight = document.documentElement.clientHeight;
var clientWidth = document.documentElement.clientWidth;
export default {
  props: ['config', 'prompt', 'popup'],
  data() {
    return {};
  },

  watch: {},
  computed: {},
  created() {},
  methods: {
    onClick(d) {
      if (typeof this.config.click == 'function') {
        this.config.click(d);
      }
    },
  },
};
</script>

<style></style>
