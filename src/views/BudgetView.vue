<template>
  <div class="view view-budget">
    <div class="flex content-between circle-header view-card">
      <div style="width: 30%" @click="payBudget.showDate()" class="main-color-1">
        <div>{{ budgetYear }}</div>
        <div class="month-big">{{ budgetMonth }}</div>
      </div>
      <div style="width: 20%" class="flex flex-center">
        <ProgressRing :percent="Number(payBudget.list.percent)" :size="60" />
      </div>
      <div class="circle-header-data" style="width: 50%">
        <van-cell title="预算：" :value="fm0(payBudget.list.m)" />
        <van-cell title="支出：" :value="fm0(payBudget.list.pm)" />
        <van-cell title="剩余：" :value="fm0(payBudget.list.lm)" :value-class="Number(payBudget.list.lm) < 0 ? 'money-out' : ''" />
      </div>
    </div>

    <div class="flex content-between pay-budget-list-head pay-budget-list bottom-line">
      <div @click="payBudget.switchType()" class="main-color-1">
        {{ payBudget.typeIsSmallOrBig == 'big' ? '大' : '小' }}类别
      </div>
      <div @click="payBudget.changeSort('m')">预算</div>
      <div @click="payBudget.changeSort('pm')">支出</div>
      <div @click="payBudget.changeSort('lm')">剩余</div>
      <div>&emsp;&emsp;</div>
    </div>

    <div v-if="listVisible" class="view-scroll budget-list">
      <van-empty v-if="listNow.length === 0" description="本月暂无预算">
        <van-button plain type="primary" size="small" @click="payBudget.copy()">
          复制上个月的预算
        </van-button>
      </van-empty>
      <van-swipe-cell v-for="(d, i) in listNow" :key="i">
        <div class="flex content-between pay-budget-list-line pay-budget-list bottom-line">
          <div>{{ d.sn }}</div>
          <div @click="payBudget.toUpdate(d)" class="main-color-1">{{ fm0(d.m) }}</div>
          <div>{{ fm0(d.pm) }}</div>
          <div :style="Number(d.lm / 100) < 0 ? 'color:red' : ''">{{ fm0(d.lm) }}</div>
          <div @click="payBudget.showEntryDetail(d)">
            <van-icon color="#14c9a8" name="arrow" />
          </div>
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
    </div>

    <div class="fixed-bottom flex-group">
      <van-button icon="replay" block size="small" type="primary" @click="payBudget.switchType()">
        大/小类
      </van-button>
      <van-button icon="plus" block plain size="small" type="primary" @click="payBudget.add()">
        新增
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { payBudget } from '@/store';
import ProgressRing from '@/components/ProgressRing.vue';

const budgetYear = computed(() => new Date(payBudget.list.d).format('yyyy年'));
const budgetMonth = computed(() => new Date(payBudget.list.d).format('MM月'));
const listNow = computed(() =>
  payBudget.typeIsSmallOrBig === 'big' ? payBudget.list.big : payBudget.list.small,
);
const listVisible = computed(() => payBudget.list.visible);

function fm0(v) {
  return Number(v / 100).toFixed(2);
}

onMounted(() => payBudget.showByMonth());
</script>