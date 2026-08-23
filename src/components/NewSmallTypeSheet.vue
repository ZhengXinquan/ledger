<template>
  <van-popup v-model:show="popup.show" round position="bottom" :style="{ height: '70%' }">
    <div class="flex-column sheet-pad">
      <div class="flex content-between sheet-head">
        <van-icon name="cross" size="20px" @click="popup.show = false"></van-icon>
        <van-icon name="success" size="20px" @click="popup.doConfirm()"></van-icon>
      </div>
      <div class="flex sheet-field">
        <van-field
          :required="popup.required"
          clearable
          v-model="popup.value"
          :label="popup.label"
          :placeholder="popup.placeholder"
        ></van-field>
      </div>
      <div class="flex content-around popup-list">
        <div
          v-for="(d, i) in popup.list"
          class="popup-list-item circle circle-not-active"
          :class="{ 'circle-active': i == popup.selectIndex }"
          :key="i"
          @click="popup.selectIndex = i"
        >
          {{ d.n }}
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { popup } from '@/store';
</script>"