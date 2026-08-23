<template>
  <van-popup
    v-model:show="typeSelect.show"
    position="bottom"
    :style="{ height: '100%' }"
  >
    <div class="type-select-head">
      <div></div>
      <div
        @click="typeSelect.payTab()"
        class="selectTypePopup-tab"
        :class="{ 'selectTypePopup-active': typeSelect.activeTab == 'pay' }"
      >
        {{ typeSelect.title[0] }}
      </div>
      <div
        v-show="typeSelect.title[1]"
        @click="typeSelect.incomeTab()"
        class="selectTypePopup-tab"
        :class="{ 'selectTypePopup-active': typeSelect.activeTab == 'income' }"
      >
        {{ typeSelect.title[1] }}
      </div>
      <div @click="typeSelect.show = false">取消</div>
    </div>

    <div
      v-show="typeSelect.activeTab == 'pay'"
      class="type-select-body"
    >
      <div class="flex content-around tab-3-list">
        <div
          v-for="(d, i) in typeSelect.smallList"
          v-show="typeSelect.hideIndexGroup.indexOf(i) == -1"
          class="flex-column flex-center tab-3-list-item circle-not-active"
          :class="{ 'circle-active': i == typeSelect.smallIndex }"
          :key="i"
          @click="typeSelect.onTypeSelected(d, i, 2)"
        >
          <div class="circle flex flex-center">{{ d.bn }}</div>
          <span>{{ d.n }}</span>
        </div>
      </div>
    </div>
    <div
      v-show="typeSelect.activeTab == 'income' && typeSelect.title[1]"
      class="type-select-body"
    >
      <div class="flex content-around tab-3-list">
        <div
          v-for="(d, i) in typeSelect.bigList"
          class="flex-column flex-center tab-3-list-item circle-not-active"
          :class="{ 'circle-active': i == typeSelect.bigIndex }"
          :key="i"
          @click="typeSelect.onTypeSelected(d, i, 1)"
        >
          <div class="circle flex flex-center">{{ d.bn }}</div>
          <span>{{ d.n }}</span>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { typeSelect } from '@/store';
</script>