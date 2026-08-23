<template>
  <van-popup v-model:show="search.visible" position="bottom" :style="{ height: '100%' }">
    <van-nav-bar
      title="搜索"
      right-text="返回"
      left-arrow
      @click-left="search.close()"
      @click-right="search.close()"
    ></van-nav-bar>

    <van-form @submit="search.submit()">
      <van-field
        v-model="search.data.n"
        name="n"
        label="关键词"
        placeholder="模糊搜索"
        clearable
      ></van-field>
      <van-field
        v-model="search.data.bn"
        name="bn"
        label="大类名称"
        placeholder="精确搜索"
        clearable
      ></van-field>
      <van-field
        v-model="search.data.sn"
        name="sn"
        label="小类名称"
        placeholder="精确搜索"
        clearable
      ></van-field>

      <van-field
        readonly
        clickable
        name="st"
        :model-value="search.data.st"
        label="开始日期"
        placeholder="点击选择日期"
        @click="search.dateSelect('st')"
        clearable
      ></van-field>
      <van-field
        readonly
        clickable
        name="et"
        :model-value="search.data.et"
        label="结束日期"
        placeholder="点击选择日期"
        @click="search.dateSelect('et')"
        clearable
      ></van-field>

      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit">提交</van-button>
      </div>
      <div style="margin: 16px">
        <van-button round block plain type="primary" native-type="button" @click="search.reset()"
          >重置</van-button
        >
      </div>
    </van-form>
  </van-popup>
</template>

<script setup>
import { search } from '@/store';
</script>"