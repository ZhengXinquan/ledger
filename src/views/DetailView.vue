<template>
  <div class="view view-detail">
    <van-grid :column-num="3" icon-size="30" class="view-card">
      <van-grid-item @click="accountBook.showMonthSelect()">
        <div class="main-color-2">{{ year }}</div>
        <div class="main-color-2 month-big">{{ month }}</div>
      </van-grid-item>
      <van-grid-item icon-prefix="grfont" icon="shouru" :text="overview.income" />
      <van-grid-item icon-prefix="grfont" icon="zhichu" :text="overview.expense" />
    </van-grid>

    <van-cell title="搜索" is-link class="view-card" @click="search.open()" />

    <van-pull-refresh v-model="ui.refreshing" @refresh="onRefresh" class="view-scroll">
      <template v-if="groups.length">
        <template v-for="(group, k) in groups" :key="k">
          <div class="flex content-between account-book-time">
            <div>{{ group.day }}</div>
            <div class="day-sum">收 +{{ group.income }} 支 -{{ group.expense }}</div>
          </div>
          <van-swipe-cell v-for="(d, i) in group.list" :key="i">
            <div class="flex content-between account-book-detail">
              <div class="account-book-detail-type flex flex-center">
                <div @click="accountBook.changeType(d)" class="circle flex flex-center">
                  {{ (d.tn || '').substr(0, 2) }}
                </div>
              </div>
              <div
                @click="accountBook.editDetail(d)"
                class="account-book-detail-name bottom-line"
              >
                {{ d.n }}
              </div>
              <div
                @click="accountBook.editDetail(d)"
                class="account-book-detail-money bottom-line"
                :class="d.tt == 1 ? 'money-in' : 'money-out'"
              >
                {{ d.tt == 1 ? '+' : '-' }}{{ Number(d.m / 100).toFixed(2) }}
              </div>
            </div>
            <template #right>
              <van-button
                @click="accountBook.deleteDetail(d)"
                square
                text="删除"
                type="danger"
                class="delete-button"
              />
            </template>
          </van-swipe-cell>
        </template>
      </template>
      <van-empty v-else description="本月暂无记录" />
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { accountBook, search, ui } from '@/store';

const year = computed(() => new Date(accountBook.month).format('yyyy年'));
const month = computed(() => new Date(accountBook.month).format('MM月'));

// 按日分组（保持原 c_accountBookMonthList_GroupByDay 行为）
const groups = computed(() => {
  const map = {};
  accountBook.monthList.forEach(d => {
    const day = new Date(d.d).format('yyyy-MM-dd');
    if (!map[day]) {
      map[day] = { day, list: [], income: '0.00', expense: '0.00' };
    }
    map[day].list.push(d);
    if (d.tt == 1) {
      map[day].income = Number(map[day].income) + Number(d.m) / 100;
    } else {
      map[day].expense = Number(map[day].expense) + Number(d.m) / 100;
    }
    map[day].income = Number(map[day].income).toFixed(2);
    map[day].expense = Number(map[day].expense).toFixed(2);
  });
  return Object.keys(map)
    .sort()
    .map(k => map[k]);
});

const overview = computed(() => {
  let income = 0;
  let expense = 0;
  accountBook.monthList.forEach(d => {
    if (d.tt == 1) income += Number(d.m);
    else expense += Number(d.m);
  });
  return { income: (income / 100).toFixed(2), expense: (expense / 100).toFixed(2) };
});

function onRefresh() {
  accountBook.showByMonth();
}
</script>