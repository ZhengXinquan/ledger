<template>
  <div id="app">
    <van-nav-bar :title="title"></van-nav-bar>

    <!-- 菜单 明细 -->
    <transition name="van-slide-left">
      <div v-show="activeTabBar == 1">
        <van-grid icon-size="30" :column-num="3">
          <van-grid-item @click="showAccountBookMonthSelectFn">
            <div class="main-color-2">
              {{ new Date(accountBookMonthList_month).format('yyyy年') }}
            </div>
            <div class="main-color-2" style="font-size: 28px">
              {{ new Date(accountBookMonthList_month).format('MM月') }}
            </div>
          </van-grid-item>
          <van-grid-item
            icon-prefix="grfont"
            icon="shouru"
            :text="Number(c_accountBookMonthList_GroupByDay.shouru / 100).toFixed(2)"
          ></van-grid-item>
          <van-grid-item
            icon-prefix="grfont"
            icon="zhichu"
            :text="Number(c_accountBookMonthList_GroupByDay.zhichu / 100).toFixed(2)"
          ></van-grid-item>
        </van-grid>
        <van-cell title="搜索" @click="search.visible = true">
          <template #right-icon>
            <van-icon color="#FF9966" name="arrow" />
          </template>
        </van-cell>
        <van-pull-refresh
          v-model="refreshing"
          @refresh="showAccountBookByMonthFn"
          :style="'overflow-y: auto;height:' + (minClientHeight - 140) + 'px'"
        >
          <div v-for="(group, k) in c_accountBookMonthList_GroupByDay.data" :key="k">
            <div class="flex content-between account-book-time">
              <div>{{ k }}</div>
              <div style="text-align: right; padding-right: 16px; box-sizing: border-box">
                收入：+{{ Number(group.sum[1] / 100).toFixed(2) }} 支出：-{{
                  Number(group.sum[2] / 100).toFixed(2)
                }}
              </div>
            </div>
            <van-swipe-cell v-for="(d, i) in group.list" :key="i">
              <div class="flex content-between account-book-detail">
                <div class="account-book-detail-type flex flex-center">
                  <div @click="changeAccountBookTypeFn(d)" class="circle flex flex-center">
                    {{ d.tn.substr(0, 2) }}
                  </div>
                </div>
                <div
                  @click="changeAccountBookDetailFn(d)"
                  class="account-book-detail-name bottom-line"
                >
                  {{ d.n }}
                </div>
                <div
                  @click="changeAccountBookDetailFn(d)"
                  class="account-book-detail-money bottom-line"
                >
                  {{ d.tt == 1 ? '+' : '-' }}{{ Number(d.m / 100).toFixed(2) }}
                </div>
              </div>
              <template #right>
                <van-button
                  @click="deleteAccountBookDetailFn(d)"
                  square
                  text="删除"
                  type="danger"
                  class="delete-button"
                />
              </template>
            </van-swipe-cell>
          </div>
        </van-pull-refresh>
      </div>
    </transition>
    <!-- 菜单 图表 -->
    <transition name="van-slide-right">
      <div v-show="activeTabBar == 2">
        <van-tabs v-model="chart.type" type="card">
          <van-tab title="周" name="week"></van-tab>
          <van-tab title="月" name="month"></van-tab>
          <van-tab title="年" name="year"></van-tab>
        </van-tabs>
        <van-tabs v-model="chart.time">
          <van-tab
            v-for="(t, i) in chart.timeList"
            :key="i"
            :title="t.title"
            :name="t.value"
          ></van-tab>
        </van-tabs>

        <div id="myChart" ref="myChart" style="width: 375px; height: 110px"></div>

        <div
          v-show="chart.visibleType == 'detail'"
          class="flex content-between pay-detail-list-head"
        >
          <div>
            支出明细排行榜·{{ chart.isBig ? '大类' : '小类' }}&emsp;&emsp;&emsp;总计{{
              chart.detailConfig.sum / 100
            }}
          </div>
          <div @click="chart.visibleType = 'type'">返回</div>
        </div>
        <div v-show="chart.visibleType == 'type'" class="flex content-between pay-detail-list-head">
          <div>
            支出分类排行榜·{{ chart.isBig ? '大类' : '小类' }}&emsp;&emsp;&emsp;总计{{
              chart.isBig ? chart.bigTypeConfig.sum / 100 : chart.smallTypeConfig.sum / 100
            }}
          </div>
          <div>
            <van-switch
              v-model="chart.isBig"
              size="24"
              active-color="#FF9966"
              inactive-color="#99CC99"
            ></van-switch>
          </div>
        </div>
        <van-pull-refresh
          v-model="refreshing"
          @refresh="showAccountBookDetailByTimeFn"
          :style="'overflow-y: auto;height:' + (minClientHeight - 297) + 'px'"
        >
          <transition name="van-slide-right">
            <div v-if="chart.visibleType == 'detail'">
              <ComponentPaydetailList
                ref="paybudgettype-list-detail"
                :config="chart.detailConfig"
                :prompt="prompt"
                @toLoading="toLoading"
              ></ComponentPaydetailList>
            </div>
          </transition>
          <transition name="van-slide-right">
            <div v-if="chart.visibleType == 'type' && !chart.isBig">
              <ComponentPaydetailList
                ref="paybudgettype-list-smalltype"
                :config="chart.smallTypeConfig"
                :prompt="prompt"
                @toLoading="toLoading"
              ></ComponentPaydetailList>
            </div>
          </transition>
          <transition name="van-slide-right">
            <div v-show="chart.visibleType == 'type' && chart.isBig">
              <ComponentPaydetailList
                ref="paybudgettype-list-smalltype"
                :config="chart.bigTypeConfig"
                :prompt="prompt"
                @toLoading="toLoading"
              ></ComponentPaydetailList>
            </div>
          </transition>
        </van-pull-refresh>
      </div>
    </transition>
    <!-- 菜单 记账 -->
    <!-- 菜单 预算 -->
    <transition name="van-slide-left">
      <div v-show="activeTabBar == 4">
        <div class="flex content-between circle-header">
          <div style="width: 30%" @click="showPayBudgetDate" class="main-color-1">
            <div>{{ new Date(payBudgetMonthList.d).format('yyyy年') }}</div>
            <div style="font-size: 38px">
              {{ new Date(payBudgetMonthList.d).format('MM月') }}
            </div>
          </div>
          <div style="width: 20%">
            <van-circle
              v-if="payBudgetMonthList.visible"
              v-model="payBudgetMonthList.currentRate"
              color="#FF9966"
              size="60"
              :rate="payBudgetMonthList.percent"
              :speed="100"
              :text="payBudgetMonthList.percent + '%'"
            ></van-circle>
          </div>
          <div class="circle-header-data" style="width: 50%">
            <van-cell
              title="预算："
              :value="Number(payBudgetMonthList.m / 100).toFixed(2)"
            ></van-cell>
            <van-cell
              title="支出："
              :value="Number(payBudgetMonthList.pm / 100).toFixed(2)"
            ></van-cell>
            <van-cell
              title="剩余："
              :value="Number(payBudgetMonthList.lm / 100).toFixed(2)"
            ></van-cell>
          </div>
        </div>
        <div class="flex content-between pay-budget-list-head pay-budget-list bottom-line">
          <div @click="switchType" class="main-color-1">
            {{ pay_budget_type_is_small_or_big == 'big' ? '大' : '小' }}类别
          </div>
          <div @click="change_payBudgetMonthList_sort_fn('m')">预算</div>
          <div @click="change_payBudgetMonthList_sort_fn('pm')">支出</div>
          <div @click="change_payBudgetMonthList_sort_fn('lm')">剩余</div>
          <div>&emsp;&emsp;</div>
        </div>
        <van-pull-refresh
          v-model="refreshing"
          @refresh="showPayBudgetByMonthFn_refresh"
          :style="'overflow-y: auto;height:' + (minClientHeight - 215) + 'px'"
        >
          <div
            v-if="c_payBudgetMonthList.length == 0"
            class="flex flex-center"
            style="height: 100%"
          >
            <van-button type="info" @click="copyDateFn">复制上个月的预算</van-button>
          </div>
          <ComponentPaybudgetList
            ref="paybudget-list"
            :config="c_payBudgetConfig"
            :prompt="prompt"
            @toLoading="toLoading"
          ></ComponentPaybudgetList>
        </van-pull-refresh>
        <div class="fixed-bottom flex-group">
          <van-button icon="replay" block size="small" type="info" @click="switchType">
            大/小类
          </van-button>
          <van-button icon="plus" block plain size="small" type="info" @click="addPayBudgetFn">
            新增
          </van-button>
        </div>
      </div>
    </transition>
    <!-- 菜单 我的 -->
    <transition name="van-slide-right">
      <div v-show="activeTabBar == 5">
        <van-grid icon-size="30" :column-num="5">
          <van-grid-item @click="myBill.setYearFn">
            <div class="main-color-2" style="font-size: 22px">
              {{ myBill.year }}<span style="font-size: 10px">年</span>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="my-page-top-grid">
              <span>预算</span><span>{{ Number(myBill.budget / 100).toFixed(0) }}</span>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="my-page-top-grid">
              <span>收入</span><span>{{ Number(myBill.income / 100).toFixed(0) }}</span>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="my-page-top-grid">
              <span>支出</span><span>{{ Number(myBill.pay / 100).toFixed(0) }}</span>
            </div>
          </van-grid-item>
          <van-grid-item>
            <div class="my-page-top-grid">
              <span>收-支</span><span>{{ Number(myBill.lincome / 100).toFixed(0) }}</span>
            </div>
          </van-grid-item>
          <!-- <van-grid-item
              icon-prefix="grfont"
              icon="yusuan"
              :text="Number(myBill.budget/100).toFixed(0)"
            ></van-grid-item>
            <van-grid-item
              icon-prefix="grfont"
              icon="shouru"
              :text="Number(myBill.income/100).toFixed(0)"
            ></van-grid-item>
            <van-grid-item
              icon-prefix="grfont"
              icon="zhichu"
              :text="Number(myBill.pay/100).toFixed(0)"
            ></van-grid-item>
            <van-grid-item
              icon-prefix="grfont"
              icon="shengyukeyongedu"
              :text="Number(myBill.lincome/100).toFixed(0)"
            ></van-grid-item> -->
        </van-grid>
        <van-cell title="分类设置" @click="showTypesFn('bigType_pay', '')">
          <template #right-icon>
            <van-icon color="#FF9966" name="arrow" />
          </template>
        </van-cell>
        <div class="flex content-between my-bill-list-head my-bill-list bottom-line">
          <div>月份</div>
          <div>预算结余</div>
          <div>预算</div>
          <div>支出</div>
          <div>收入</div>
          <div>收入结余</div>
        </div>
        <van-pull-refresh
          v-model="refreshing"
          @refresh="myBill.getBillFn"
          :style="'overflow-y: auto;height:' + (minClientHeight - 170) + 'px'"
        >
          <div
            v-for="(d, i) in myBill.list"
            :key="i"
            class="flex content-between my-bill-list-line my-bill-list bottom-line"
          >
            <div>{{ new Date(d.d).format('MM') }}</div>
            <div :style="Number(d.lbudget / 100) < 0 ? 'color:red' : ''">
              {{ Number(d.lbudget / 100).toFixed(0) }}
            </div>
            <div>{{ Number(d.budget / 100).toFixed(0) }}</div>
            <div>{{ Number(d.pay / 100).toFixed(0) }}</div>
            <div>{{ Number(d.income / 100).toFixed(0) }}</div>
            <div :style="Number(d.lincome / 100) < 0 ? 'color:red' : ''">
              {{ Number(d.lincome / 100).toFixed(0) }}
            </div>
          </div>
        </van-pull-refresh>
      </div>
    </transition>
    <!-- 底部菜单 -->
    <van-tabbar @change="onChangeTabBarFn">
      <van-tabbar-item
        name="1"
        icon="balance-list-o"
        :class="{ 'tabbar-active': activeTabBar == 1 }"
        >明细</van-tabbar-item
      >
      <van-tabbar-item
        name="2"
        icon="chart-trending-o"
        :class="{ 'tabbar-active': activeTabBar == 2 }"
        >图表</van-tabbar-item
      >
      <van-tabbar-item name="3" icon-prefix="grfont" icon="wuuiconxiangjifangda"></van-tabbar-item>
      <van-tabbar-item name="4" icon="after-sale" :class="{ 'tabbar-active': activeTabBar == 4 }"
        >预算</van-tabbar-item
      >
      <van-tabbar-item name="5" icon="home-o" :class="{ 'tabbar-active': activeTabBar == 5 }"
        >我的</van-tabbar-item
      >
    </van-tabbar>

    <!-- 弹出搜索 -->
    <van-popup v-model="search.visible" position="bottom" style="height: 100%">
      <van-nav-bar
        title="搜索"
        right-text="返回"
        left-arrow
        @click-left="search.visible = false"
        @click-right="search.visible = false"
      ></van-nav-bar>

      <van-form @submit="searchAccountBook">
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
          :value="search.data.st"
          label="开始日期"
          placeholder="点击选择日期"
          @click="showSearchDateSelectFn('st')"
          clearable
        ></van-field>
        <van-field
          readonly
          clickable
          name="et"
          :value="search.data.et"
          label="结束日期"
          placeholder="点击选择日期"
          @click="showSearchDateSelectFn('et')"
          clearable
        ></van-field>

        <div style="margin: 16px">
          <van-button round block type="info" native-type="submit">提交</van-button>
        </div>
        <div style="margin: 16px">
          <van-button round block type="info" plain native-type="button" @click="resetSearch"
            >重置</van-button
          >
        </div>
      </van-form>
    </van-popup>

    <!-- 弹出分类设置 -->
    <van-popup v-model="typesTabsVisible" position="bottom" style="height: 100%">
      <van-nav-bar
        title="分类设置"
        right-text="返回"
        left-arrow
        @click-left="typesTabsVisible = false"
        @click-right="typesTabsVisible = false"
      ></van-nav-bar>
      <van-tabs @click="showTypesFn" type="card" animated>
        <van-tab title="大类支出" name="bigType_pay">
          <ComponentTypeList
            ref="bigType_pay"
            type="bigType_pay"
            :prompt="prompt"
            @toLoading="toLoading"
          ></ComponentTypeList>
        </van-tab>
        <van-tab title="小类支出" name="smallType_pay">
          <ComponentTypeList
            ref="smallType_pay"
            type="smallType_pay"
            :prompt="prompt"
            :popup="popup"
            @toLoading="toLoading"
          ></ComponentTypeList>
        </van-tab>
        <van-tab title="收入" name="bigType_income">
          <ComponentTypeList
            ref="bigType_income"
            type="bigType_income"
            :prompt="prompt"
            @toLoading="toLoading"
          ></ComponentTypeList>
        </van-tab>
      </van-tabs>
    </van-popup>

    <!-- 弹出归属分类的明细排行 -->
    <van-popup
      v-model="payBudgetMonthListTypeDetail.show"
      round
      position="bottom"
      style="height: 86%"
    >
      <div class="pay-detail-list-head">分类支出明细排行榜</div>
      <ComponentPaydetailList
        ref="paybudgettype-list-2"
        :config="payBudgetMonthListTypeDetail.config"
        :prompt="prompt"
        @toLoading="toLoading"
      ></ComponentPaydetailList>
    </van-popup>
    <!-- 弹出归属大分类的小分类 -->
    <van-popup
      v-model="payBudgetMonthListSmallDetail.show"
      round
      position="bottom"
      style="height: 86%"
    >
      <div class="pay-detail-list-head">小类预算排行榜</div>
      <div class="flex content-between pay-budget-list-head pay-budget-list bottom-line">
        <div>类别</div>
        <div>预算</div>
        <div>支出</div>
        <div>剩余</div>
        <div>&emsp;&emsp;</div>
      </div>
      <ComponentPaybudgetList
        ref="paybudget-list-2"
        :config="payBudgetMonthListSmallDetail.config"
        :prompt="prompt"
        @toLoading="toLoading"
      ></ComponentPaybudgetList>
    </van-popup>

    <!-- 弹出日期选择 -->
    <van-popup v-model="datePicker.show" round position="bottom">
      <van-datetime-picker
        v-model="datePicker.value"
        :type="datePicker.type"
        title="选择年月日"
        :min-date="datePicker.min"
        :max-date="datePicker.max"
        @confirm="datePicker.confirm"
        @cancel="datePicker.show = false"
      >
      </van-datetime-picker>
    </van-popup>
    <!-- 弹出键盘 -->
    <van-popup
      v-model="keyboard.show"
      round
      position="bottom"
      style="height: 300px"
      @close="keyboard.onClose"
    >
      <div class="flex-column" style="box-sizing: border-box; padding: 0.5em 1em">
        <div
          class="flex-group keyboard-input"
          style="margin: 1em auto; border-bottom: 1px solid blue"
        >
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
          <div
            class="keyboard-list-item"
            @click="keyboard.clickNumber('date')"
            style="font-size: 12px"
          >
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
          <div
            class="keyboard-list-item"
            @click="keyboard.clickNumber('delete')"
            style="font-size: 18px"
          >
            删除
          </div>
          <div
            class="keyboard-list-item"
            @click="keyboard.clickNumber('done')"
            style="font-size: 20px"
          >
            {{ keyboard.doneName }}
          </div>
        </div>
      </div>
    </van-popup>
    <!-- 弹出记账的分类 -->
    <van-popup
      v-model="selectTypePopup.show"
      position="bottom"
      style="height: 100%"
      @close="selectTypePopup.onClose"
    >
      <div
        class="flex content-between"
        style="padding: 8px; box-sizing: border-box; color: darkorange"
      >
        <div></div>
        <div
          @click="selectTypePopupTabsClickToGetList('pay')"
          class="selectTypePopup-tab"
          :class="{ 'selectTypePopup-active': selectTypePopup.activeTab == 'pay' }"
        >
          {{ selectTypePopup.title[0] }}
        </div>
        <div
          v-show="selectTypePopup.title[1]"
          @click="selectTypePopupTabsClickToGetList('income')"
          class="selectTypePopup-tab"
          :class="{ 'selectTypePopup-active': selectTypePopup.activeTab == 'income' }"
        >
          {{ selectTypePopup.title[1] }}
        </div>
        <div @click="selectTypePopup.show = false">取消</div>
      </div>
      <div v-show="selectTypePopup.activeTab == 'pay'" :style="'height:' + minClientHeight + 'px'">
        <van-pull-refresh
          v-model="refreshing"
          @refresh="showSmallPayTypesFn"
          :style="'overflow-y: auto;height:' + minClientHeight + 'px'"
        >
          <div class="flex content-around tab-3-list flex-auto">
            <div
              v-for="(d, i) in smallPayTypesList"
              v-show="selectTypePopup.hideIndexGroup.indexOf(i) == -1"
              class="flex-column flex-center tab-3-list-item circle-not-active"
              :class="{ 'circle-active': i == smallPayTypesListSelectIndex }"
              :key="i"
              @click="onTypeSelectedFn(d, i, 2)"
            >
              <div class="circle flex flex-center">{{ d.bn }}</div>
              <span>{{ d.n }}</span>
            </div>
          </div>
        </van-pull-refresh>
      </div>
      <div
        v-show="selectTypePopup.activeTab == 'income' && selectTypePopup.title[1]"
        :style="'height:' + minClientHeight + 'px'"
      >
        <van-pull-refresh
          v-model="refreshing"
          @refresh="showBigIncomeTypesFn"
          :style="'overflow-y: auto;height:' + minClientHeight + 'px'"
        >
          <div class="flex content-around tab-3-list flex-auto">
            <div
              v-for="(d, i) in bigIncomeTypesList"
              class="flex-column flex-center tab-3-list-item circle-not-active"
              :class="{ 'circle-active': i == bigIncomeTypesListSelectIndex }"
              :key="i"
              @click="onTypeSelectedFn(d, i, 1)"
            >
              <div class="circle flex flex-center">{{ d.bn }}</div>
              <span>{{ d.n }}</span>
            </div>
          </div>
        </van-pull-refresh>
      </div>
    </van-popup>
    <!-- 小类添加弹出层(选择类别 填写值) -->
    <van-popup
      v-model="popup.show"
      round
      position="bottom"
      :style="{ height: '70%' }"
      @close="popup.onClose"
    >
      <div class="flex-column" style="box-sizing: border-box; padding: 1em">
        <div class="flex content-between">
          <van-icon name="cross" size="20px" color="red" @click="popup.show = false"></van-icon>
          <van-icon name="success" size="20px" color="red" @click="popup.onConfirmFn"></van-icon>
        </div>
        <div class="flex" style="margin: 1em auto; border-bottom: 1px solid blue">
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
    <!-- 通用prompt层 -->
    <van-dialog
      v-model="prompt.show"
      :title="prompt.title"
      show-cancel-button
      :before-close="prompt.onBeforeClose"
    >
      <van-field
        :required="prompt.required"
        clearable
        v-model="prompt.value"
        :label="prompt.label"
        :placeholder="prompt.placeholder"
      />
    </van-dialog>
    <!-- 通用loading -->
    <van-overlay :show="loading" get-container="body" z-index="5500">
      <van-loading
        style="top: 50%; transform: translate(0, -50%)"
        size="50px"
        color="blue"
        :vertical="true"
      >
      </van-loading>
    </van-overlay>
  </div>
</template>

<script>
import pageMiXin from './components/mixin';

export default {
  name: 'App',
  mixins: [pageMiXin],
};
</script>
