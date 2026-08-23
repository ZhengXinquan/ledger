<template>
  <van-overlay
    :show="loadingVisible"
    z-index="5500"
    :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center' }"
  >
    <van-loading size="50px" color="#14c9a8" vertical>加载中...</van-loading>
  </van-overlay>
</template>

<script setup>
import { loadingVisible } from '@/store';
</script>