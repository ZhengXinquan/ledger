<template>
  <van-popup
    v-model:show="keyboard.show"
    round
    position="bottom"
    :style="{ height: '300px' }"
  >
    <div class="flex-column keypad-wrap">
      <div class="flex-group keyboard-input">
        <van-field
          class="keyboard-input-name"
          clearable
          v-model="keyboard.name"
          placeholder="点击写备注"
        ></van-field>
        <van-field
          class="keyboard-input-money"
          readonly
          v-model="keyboard.money"
          input-align="right"
        ></van-field>
      </div>
      <div class="flex keyboard-list">
        <div class="keyboard-list-item" @click="keyboard.clickNumber(7)">7</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(8)">8</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(9)">9</div>
        <div class="keyboard-list-item keyboard-date" @click="keyboard.clickNumber('date')">
          {{ keyboard.day }}
        </div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(4)">4</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(5)">5</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(6)">6</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber('+')">+</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(1)">1</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(2)">2</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(3)">3</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber('-')">-</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber('.')">.</div>
        <div class="keyboard-list-item" @click="keyboard.clickNumber(0)">0</div>
        <div class="keyboard-list-item keyboard-delete" @click="keyboard.clickNumber('delete')">
          删除
        </div>
        <div class="keyboard-list-item keyboard-done" @click="keyboard.clickNumber('done')">
          {{ keyboard.doneName }}
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { keyboard } from '@/store';
</script>