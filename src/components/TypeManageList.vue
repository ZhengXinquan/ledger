<template>
  <div class="type-manage">
    <div class="type-manage-scroll">
      <van-cell-group inset title="使用中">
        <draggable
          :list="showList"
          item-key="id"
          handle=".my-handle"
          animation="200"
          @start="onStart"
          @end="onEnd"
        >
          <template #item="{ element }">
            <van-cell center>
              <template #title>
                <div class="flex content-between">
                  <div @click="onUpdateName(element)">
                    {{ fileType == 'smallType' ? element.bn + ' - ' : '' }}{{ element.n }}
                  </div>
                  <van-icon name="wap-nav" size="18px" class="custom-icon my-handle" />
                </div>
              </template>
              <template #icon>
                <van-icon name="close" size="18px" class="custom-icon" @click="hideById(element)" />
              </template>
            </van-cell>
          </template>
        </draggable>
      </van-cell-group>

      <van-cell-group inset title="未使用">
        <van-cell center v-for="(d, i) in hideList" :key="i">
          <template #title>
            <div class="flex content-between">
              <div @click="onUpdateName(d)">
                {{ fileType == 'smallType' ? d.bn + ' - ' : '' }}{{ d.n }}
              </div>
              <van-icon name="delete" size="18px" class="custom-icon" @click="deleteById(d)" />
            </div>
          </template>
          <template #icon>
            <van-icon name="add-o" size="18px" class="custom-icon" @click="showById(d)" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <div class="fixed-bottom flex-group">
      <van-button icon="replay" block size="small" type="primary" @click="init"> 刷新 </van-button>
      <van-button icon="plus" block plain size="small" type="primary" @click="add"> 新增 </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { showConfirmDialog } from 'vant';
import { request } from '@/utils';
import { toLoading, prompt, popup, ui } from '@/store';

const props = defineProps({
  type: { type: String, required: true }, // 'bigType_pay' | 'smallType_pay' | 'bigType_income'
});

const fileType = computed(() => props.type.split('_')[0]); // bigType | smallType
const accountType = computed(() => props.type.split('_')[1]); // pay | income
const api = computed(() => 'api/' + fileType.value);

const typeArray = ref([]);
const showList = ref([]);
const hideList = ref([]);
let dragStartOrder = [];

onMounted(() => init());

const http = (data) => request(api.value, data, toLoading);
function uiRefreshing(v) {
  /* 下拉刷新状态收敛到全局 ui.refreshing */
  ui.refreshing = v;
}

function init() {
  http({ info: 'select_all_' + accountType.value }).then(e => {
    uiRefreshing(false);
    if (e.tip === 1) {
      typeArray.value = e.d;
      showList.value = typeArray.value.filter(x => x.s == 1);
      hideList.value = typeArray.value.filter(x => x.s == 0);
    }
  });
}
function add() {
  if (fileType.value === 'bigType') {
    const t = accountType.value === 'income' ? 1 : 2;
    prompt.go('请输入新的类别', v => addType(t, v));
  } else {
    request('api/bigType', { info: 'select_' + accountType.value }, toLoading).then(e => {
      if (e.tip === 1) {
        popup.open({
          label: '名称',
          placeholder: '点击输入小类名称',
          list: e.d,
          confirm: (bid, n) => {
            addType(bid, n);
          },
        });
      }
    });
  }
}
function addType(type, n) {
  http({ info: 'insert', m: type, n }).then(e => {
    if (e.tip === 1) init();
  });
}
function onUpdateName(d) {
  prompt.go(d.n, v => {
    http({ info: 'update_name', id: d.id, n: v }).then(e => {
      if (e.tip === 1) init();
    });
  });
}
function deleteById(d) {
  showConfirmDialog({ title: '彻底删除 ' + d.n + '？', message: '无法恢复' })
    .then(() => http({ info: 'delete', id: d.id }).then(() => init()))
    .catch(() => {});
}
function hideById(d) {
  showConfirmDialog({ title: '移除 ' + d.n + '？', message: '' })
    .then(() => http({ info: 'hide', id: d.id }).then(() => init()))
    .catch(() => {});
}
function showById(d) {
  showConfirmDialog({ title: '添加 ' + d.n + '？', message: '' })
    .then(() => http({ info: 'show', id: d.id }).then(() => init()))
    .catch(() => {});
}
function onStart() {
  dragStartOrder = [].concat(showList.value.map(x => Object.assign({}, x)));
}
function onEnd() {
  reSort(showList.value, dragStartOrder);
}
function reSort(newArray, oldArray) {
  const MY_JSON = {};
  newArray.forEach((item, index) => {
    MY_JSON[item.id] = oldArray[index].i;
  });
  http({ info: 'px', list: JSON.stringify(MY_JSON) }).then(() => init());
}
</script>

<style scoped>
.type-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.type-manage-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
}
</style>