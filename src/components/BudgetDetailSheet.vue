<template>
  <van-popup
    v-model:show="payBudget.detail.show"
    round
    position="bottom"
    :style="{ height: '86%' }"
  >
    <div class="pay-detail-list-head">分类支出明细排行榜</div>
    <div class="sheet-scroll">
      <PayDetailList :config="payBudget.detail" @click-item="() => {}" />
    </div>
  </van-popup>
</template>

<script setup>
import { payBudget } from '@/store';
import PayDetailList from '@/components/PayDetailList.vue';
</script>