<template>
  <van-tabbar :model-value="ui.activeTab" @change="onChange">
    <van-tabbar-item name="1" icon="balance-list-o">明细</van-tabbar-item>
    <van-tabbar-item name="2" icon="chart-trending-o">图表</van-tabbar-item>
    <van-tabbar-item name="3" icon-prefix="grfont" icon="wuuiconxiangjifangda" />
    <van-tabbar-item name="4" icon="after-sale">预算</van-tabbar-item>
    <van-tabbar-item name="5" icon="home-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ui, accountBook, chart, payBudget, myBill, typeSelect } from '@/store';

function onChange(name) {
  if (name !== '3') {
    ui.activeTab = name;
  }
  switch (name) {
    case '1':
      accountBook.showByMonth();
      break;
    case '2':
      if (chart.detailList.length === 0) chart.showDetail();
      break;
    case '3':
      typeSelect.open({ title: ['支出', '收入'], next: 'insert', initTab: 'pay' });
      break;
    case '4':
      payBudget.showByMonth();
      break;
    case '5':
      if (myBill.list.length === 0) myBill.get();
      break;
    default:
      break;
  }
}
</script>