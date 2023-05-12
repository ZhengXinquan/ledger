<template>
  <div>
    <van-swipe-cell v-for="(d, i) in config.list" :key="i">
      <div class="flex content-between pay-budget-list-line pay-budget-list bottom-line">
        <div>{{ d.sn }}</div>
        <div @click="config.item.clickPayBudget(d)" class="main-color-1">
          {{ Number(d.m / 100).toFixed(2) }}
        </div>
        <div>{{ Number(d.pm / 100).toFixed(2) }}</div>
        <div :style="Number(d.lm / 100) < 0 ? 'color:red' : ''">
          {{ Number(d.lm / 100).toFixed(2) }}
        </div>
        <div @click="config.item.click(d)"><van-icon color="#FF9966" name="arrow" /></div>
      </div>
      <template v-if="config.right.show" #right>
        <van-button
          @click="config.right.click(d)"
          square
          :text="config.right.text"
          type="danger"
          class="delete-button"
        />
      </template>
    </van-swipe-cell>
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
  methods: {},
};
</script>

<style></style>
