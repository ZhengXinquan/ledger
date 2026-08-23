<template>
  <van-popup v-model:show="datePicker.show" round position="bottom">
    <van-date-picker
      :model-value="modelValue"
      :type="datePicker.type"
      :title="datePicker.type === 'year-month' ? '选择年月' : '选择日期'"
      :min-date="datePicker.min"
      :max-date="datePicker.max"
      @confirm="onConfirm"
      @cancel="datePicker.onCancel()"
    />
  </van-popup>
</template>

<script setup>
import { computed } from 'vue';
import { datePicker } from '@/store';

const modelValue = computed({
  get() {
    const d = datePicker.value || new Date();
    if (datePicker.type === 'year-month') {
      return [String(d.getFullYear()), String(d.getMonth() + 1)];
    }
    return [String(d.getFullYear()), String(d.getMonth() + 1), String(d.getDate())];
  },
  set() {
    /* 受控组件，仅由内部处理 */
  },
});

function onConfirm({ selectedValues }) {
  const [y, m] = selectedValues;
  if (datePicker.type === 'year-month') {
    datePicker.value = new Date(Number(y), Number(m) - 1, 1);
  } else {
    const d = selectedValues[2];
    datePicker.value = new Date(Number(y), Number(m) - 1, Number(d));
  }
  datePicker.onConfirm();
}
</script>