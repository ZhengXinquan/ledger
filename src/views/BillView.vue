<template>
  <div class="view view-bill">
    <van-grid :column-num="5" icon-size="30" class="view-card">
      <van-grid-item @click="myBill.setYear()">
        <div class="main-color-2 year-big">
          {{ myBill.year }}<span class="year-unit">年</span>
        </div>
      </van-grid-item>
      <van-grid-item>
        <div class="my-page-top-grid"><span>预算</span><span>{{ fm0(myBill.budget) }}</span></div>
      </van-grid-item>
      <van-grid-item>
        <div class="my-page-top-grid"><span>收入</span><span>{{ fm0(myBill.income) }}</span></div>
      </van-grid-item>
      <van-grid-item>
        <div class="my-page-top-grid"><span>支出</span><span>{{ fm0(myBill.pay) }}</span></div>
      </van-grid-item>
      <van-grid-item>
        <div class="my-page-top-grid"><span>收-支</span><span>{{ fm0(myBill.lincome) }}</span></div>
      </van-grid-item>
    </van-grid>

    <van-cell title="分类设置" is-link class="view-card" @click="ui.typesTabsVisible = true" />

    <div class="flex content-between my-bill-list-head my-bill-list bottom-line">
      <div>月份</div>
      <div>预算结余</div>
      <div>预算</div>
      <div>支出</div>
      <div>收入</div>
      <div>收入结余</div>
    </div>

    <van-pull-refresh v-model="ui.refreshing" @refresh="onRefresh" class="view-scroll">
      <div
        v-for="(d, i) in myBill.list"
        :key="i"
        class="flex content-between my-bill-list-line my-bill-list bottom-line"
      >
        <div>{{ new Date(d.d).format('MM') }}</div>
        <div :style="Number(d.lbudget / 100) < 0 ? 'color:red' : ''">{{ fm0(d.lbudget) }}</div>
        <div>{{ fm0(d.budget) }}</div>
        <div>{{ fm0(d.pay) }}</div>
        <div>{{ fm0(d.income) }}</div>
        <div :style="Number(d.lincome / 100) < 0 ? 'color:red' : ''">{{ fm0(d.lincome) }}</div>
      </div>
      <van-empty v-if="myBill.list.length === 0" description="暂无账单数据" />
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { myBill, ui } from '@/store';

function fm0(v) {
  return Number(v / 100).toFixed(0);
}
function onRefresh() {
  myBill.get();
}

onMounted(() => {
  if (myBill.list.length === 0) myBill.get();
});
</script>
<style scoped> 
.view-bill :deep(.van-grid-item__content){
  padding: 0!important;
}

</style>