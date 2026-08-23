<template>
  <van-popup v-model:show="ui.typesTabsVisible" position="bottom" :style="{ height: '100%' }">
    <van-nav-bar
      title="分类设置"
      right-text="返回"
      left-arrow
      @click-left="ui.typesTabsVisible = false"
      @click-right="ui.typesTabsVisible = false"
    ></van-nav-bar>
    <van-tabs v-model="activeType" type="card" sticky>
      <van-tab title="大类支出" name="bigType_pay">
        <TypeManageList type="bigType_pay" />
      </van-tab>
      <van-tab title="小类支出" name="smallType_pay">
        <TypeManageList type="smallType_pay" />
      </van-tab>
      <van-tab title="收入" name="bigType_income">
        <TypeManageList type="bigType_income" />
      </van-tab>
    </van-tabs>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue';
import { ui } from '@/store';
import TypeManageList from './TypeManageList.vue';

const activeType = ref('bigType_pay');
</script>

<style scoped>
.van-tabs {
  height: calc(100% - 46px);
  display: flex;
  flex-direction: column;
}
:deep(.van-tabs__content) {
  flex: 1;
  overflow-y: auto;
}
</style>