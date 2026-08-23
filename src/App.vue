<template>
  <div id="app">
    <van-nav-bar :title="pageTitle" fixed placeholder />

    <main class="app-main">
      <transition name="van-slide-left" mode="out-in">
        <DetailView v-if="ui.activeTab === '1'" />
      </transition>
      <transition name="van-slide-right" mode="out-in">
        <ChartView v-if="ui.activeTab === '2'" />
      </transition>
      <transition name="van-slide-left" mode="out-in">
        <BudgetView v-if="ui.activeTab === '4'" />
      </transition>
      <transition name="van-slide-right" mode="out-in">
        <BillView v-if="ui.activeTab === '5'" />
      </transition>
    </main>

    <TabBar />

    <SearchSheet />
    <TypeSelectSheet />
    <KeyboardSheet />
    <NewSmallTypeSheet />
    <DatePickerSheet />
    <PromptDialog />
    <TypeManageSheet />
    <BudgetDetailSheet />
    <BudgetSmallDetailSheet />
    <LoadingMask />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ui } from '@/store';
import DetailView from '@/views/DetailView.vue';
import ChartView from '@/views/ChartView.vue';
import BudgetView from '@/views/BudgetView.vue';
import BillView from '@/views/BillView.vue';
import TabBar from '@/components/TabBar.vue';
import SearchSheet from '@/components/SearchSheet.vue';
import TypeSelectSheet from '@/components/TypeSelectSheet.vue';
import KeyboardSheet from '@/components/KeyboardSheet.vue';
import NewSmallTypeSheet from '@/components/NewSmallTypeSheet.vue';
import DatePickerSheet from '@/components/DatePickerSheet.vue';
import PromptDialog from '@/components/PromptDialog.vue';
import TypeManageSheet from '@/components/TypeManageSheet.vue';
import BudgetDetailSheet from '@/components/BudgetDetailSheet.vue';
import BudgetSmallDetailSheet from '@/components/BudgetSmallDetailSheet.vue';
import LoadingMask from '@/components/LoadingMask.vue';

const TITLES = { 1: '明细', 2: '图表', 4: '预算', 5: '我的' };
const pageTitle = computed(() => TITLES[ui.activeTab] || '');
</script>

<style scoped>
.app-main {
  padding-bottom: 50px;
}
</style>