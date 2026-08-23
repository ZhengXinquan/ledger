<template>
  <van-popup
    v-model:show="payBudget.smallDetail.show"
    round
    position="bottom"
    :style="{ height: '86%' }"
  >
    <div class="pay-detail-list-head">小类预算排行榜</div>
    <div class="flex content-between pay-budget-list-head pay-budget-list bottom-line">
      <div>类别</div>
      <div>预算</div>
      <div>支出</div>
      <div>剩余</div>
      <div>&emsp;&emsp;</div>
    </div>
    <div class="sheet-scroll">
      <van-swipe-cell v-for="(d, i) in payBudget.smallDetail.list" :key="i">
        <div class="flex content-between pay-budget-list-line pay-budget-list bottom-line">
          <div>{{ d.sn }}</div>
          <div @click="payBudget.update(d)" class="main-color-1">{{ fm0(d.m) }}</div>
          <div>{{ fm0(d.pm) }}</div>
          <div :style="Number(d.lm / 100) < 0 ? 'color:red' : ''">{{ fm0(d.lm) }}</div>
          <div @click="removeRow(d)"><van-icon color="#14c9a8" name="arrow" /></div>
        </div>
        <template #right>
          <van-button
            @click="payBudget.delete(d)"
            square
            text="删除"
            type="danger"
            class="delete-button"
          />
        </template>
      </van-swipe-cell>
      <van-empty v-if="payBudget.smallDetail.list.length === 0" description="此类暂无小类预算" />
    </div>
  </van-popup>
</template>

<script setup>
import { payBudget } from '@/store';

function fm0(v) {
  return Number(v / 100).toFixed(2);
}
// 点箭头回到对应大类的预算弹层前，先收起小类弹层
function removeRow(d) {
  payBudget.smallDetail.show = false;
  payBudget.showTypeDetail(d);
}
</script>