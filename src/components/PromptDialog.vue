<template>
  <van-dialog
    v-model:show="prompt.show"
    :title="prompt.title"
    show-cancel-button
    :before-close="beforeClose"
  >
    <van-field
      :required="prompt.required"
      clearable
      v-model="prompt.value"
      :label="prompt.label"
      :placeholder="prompt.placeholder"
    />
  </van-dialog>
</template>

<script setup>
import { showToast } from 'vant';
import { prompt } from '@/store';

function beforeClose(action) {
  if (action === 'confirm') {
    if (prompt.required && !prompt.value && prompt.value !== '0') {
      showToast('请填写');
      return false;
    }
    const cb = prompt.onConfirm;
    prompt.onConfirm = null;
    if (typeof cb === 'function') cb(prompt.value);
  } else {
    prompt.onConfirm = null;
  }
  return true;
}
</script>