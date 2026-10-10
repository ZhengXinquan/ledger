/**
 * 全局共享状态（应用服务层）
 * 将原 mixin.js 的 data + methods 按业务域拆分为多个 reactive 单例，
 * 视图/弹层组件仅负责渲染与交互，数据与动作统一收敛于此，功能与原逻辑等价。
 */
import { reactive, computed } from 'vue';
import { showToast } from 'vant';
import '@/utils/date'; // 副作用导入：确保 Date.prototype.format 挂载早于本模块顶层初始化
import { request, DEFAULT_SEARCH } from '@/utils';

/* ------------------------------------------------------------------ */
/* loading 全局加载计数                                                */
/* ------------------------------------------------------------------ */
const loadingState = reactive({ count: 0 });
export const loadingVisible = computed(() => loadingState.count > 0);
export const toLoading = (flag = true) => {
  if (flag) {
    loadingState.count++;
  } else {
    loadingState.count--;
    if (loadingState.count < 0) loadingState.count = 0;
  }
};

/* ------------------------------------------------------------------ */
/* ui 布局 / 底部导航                                                   */
/* ------------------------------------------------------------------ */
export const ui = reactive({
  activeTab: '1', // 1明细 2图表 3记账(中部按钮) 4预算 5我的
  refreshing: false,
  typesTabsVisible: false, // 分类设置弹层
});
export const pageTitle = computed(() => {
  switch (ui.activeTab) {
    case '1':
      return '阿布记账 · 明细';
    case '2':
      return '阿布记账 · 图表';
    case '4':
      return '阿布记账 · 预算';
    case '5':
      return '阿布记账 · 年度账单';
    default:
      return '阿布记账';
  }
});

/* ------------------------------------------------------------------ */
/* datePicker 全局日期选择弹层                                          */
/* ------------------------------------------------------------------ */
export const datePicker = reactive({
  show: false,
  type: 'date', // 'date' | 'year-month'
  min: new Date(2020, 0, 1),
  max: new Date(),
  value: new Date(),
  cb: null,
  open({ type, min, max, value, confirm }) {
    this.show = true;
    if (type) this.type = type;
    if (min) this.min = min;
    if (max) this.max = max;
    this.value = value || new Date();
    this.cb = typeof confirm === 'function' ? confirm : null;
  },
  onConfirm() {
    this.show = false;
    if (typeof this.cb === 'function') this.cb();
  },
  onCancel() {
    this.show = false;
  },
});

/* ------------------------------------------------------------------ */
/* prompt 通用输入对话框（改名 / 设置预算等）                             */
/* ------------------------------------------------------------------ */
export const prompt = reactive({
  show: false,
  title: '请输入',
  label: '',
  placeholder: '请输入',
  value: '',
  required: true,
  onConfirm: null,
  go(_title, cbs) {
    this.show = false;
    this.title = _title || '请输入';
    this.label = '';
    this.placeholder = '请输入';
    this.value = '';
    this.onConfirm = typeof cbs === 'function' ? cbs : null;
    this.show = true;
  },
  doConfirm() {
    if (this.required && !this.value && this.value !== '0') {
      showToast('请填写');
      return;
    }
    const cb = this.onConfirm;
    this.onConfirm = null;
    this.show = false;
    if (typeof cb === 'function') cb(this.value);
  },
});

/* ------------------------------------------------------------------ */
/* popup 通用选择弹层（新增小类：选择归属大类 + 输入名称）                 */
/* ------------------------------------------------------------------ */
export const popup = reactive({
  show: false,
  required: true,
  label: '',
  placeholder: '请输入',
  list: [],
  selectIndex: -1,
  value: '',
  cb: null,
  open(opts = {}) {
    this.show = true;
    this.required = opts.required !== false;
    this.label = opts.label || '';
    this.placeholder = opts.placeholder || '请输入';
    this.value = '';
    this.list = opts.list || [];
    this.selectIndex = -1;
    this.cb = typeof opts.confirm === 'function' ? opts.confirm : null;
  },
  doConfirm() {
    if (this.list.length === 0) {
      showToast('无数据');
      this.show = false;
      return;
    }
    if (this.selectIndex < 0) {
      showToast('请点击选择归属类别');
      return;
    }
    const d = this.list[this.selectIndex];
    if (!d) {
      showToast('无效选择');
      return;
    }
    if (this.required && !this.value && this.value !== '0') {
      showToast('请填写');
      return;
    }
    const cb = this.cb;
    this.cb = null;
    this.show = false;
    if (typeof cb === 'function') cb(d.id, this.value);
  },
});

/* ------------------------------------------------------------------ */
/* search 搜索弹层                                                     */
/* ------------------------------------------------------------------ */
export const search = reactive({
  visible: false,
  data: DEFAULT_SEARCH(),
  open() {
    this.visible = true;
  },
  close() {
    this.visible = false;
  },
  reset() {
    this.data = DEFAULT_SEARCH();
  },
  dateSelect(key) {
    datePicker.open({
      type: 'date',
      min: new Date(2020, 1, 1),
      max: new Date(),
      value: new Date(),
      confirm: () => {
        datePicker.type = 'date';
        this.data[key] = datePicker.value.format('yyyy-MM-dd');
      },
    });
  },
  submit() {
    this.visible = false;
    request(
      'api/accountBook',
      {
        info: 'search',
        st: this.data.st,
        et: this.data.et,
        n: this.data.n,
        bn: this.data.bn,
        sn: this.data.sn,
      },
      toLoading,
    ).then(e => {
      ui.refreshing = false;
      if (e.tip === 1) {
        accountBook.monthList = e.d;
      }
    });
  },
});

/* ------------------------------------------------------------------ */
/* accountBook 明细页                                                  */
/* ------------------------------------------------------------------ */
export const accountBook = reactive({
  monthList: [],
  month: new Date().format('yyyy-MM'),
  setList(l) {
    this.monthList = l;
  },
  showByMonth(month) {
    if (month) this.month = month;
    request('api/accountBook', { info: 'select_by_month', month: this.month }, toLoading).then(
      e => {
        ui.refreshing = false;
        if (e.tip === 1) {
          this.monthList = e.d;
        }
      },
    );
  },
  showMonthSelect() {
    datePicker.open({
      type: 'year-month',
      min: new Date(2020, 1, 1),
      max: new Date(),
      value: new Date(this.month),
      confirm: () => {
        datePicker.type = 'date';
        this.month = datePicker.value.format('yyyy-MM');
        this.showByMonth();
      },
    });
  },
  // 修改一条明细所属的类型
  changeType(d) {
    typeSelect.open({
      title: ['支出', '收入'],
      next: 'changeType',
      before: d,
      initTab: d.tt == 2 ? 'pay' : 'income',
    });
  },
  editDetail(d) {
    keyboard.openEdit(d);
  },
  deleteDetail(d) {
    const api = d.tt == 1 ? 'api/income' : 'api/accountBook';
    request(api, { info: 'delete', id: d.id }, toLoading).then(e => {
      if (e.tip === 1) {
        showToast('已删除');
        this.showByMonth();
      } else {
        showToast(e.d || '删除失败');
      }
    });
  },
});

/* ------------------------------------------------------------------ */
/* keyboard 记账键盘（新增/编辑明细）                                    */
/* ------------------------------------------------------------------ */
export const keyboard = reactive({
  show: false,
  type: 2, // 1收入 2支出
  tid: 0,
  name: '',
  money: '0',
  day: new Date().format('yyyy-MM-dd'),
  defaultInputName: '',
  doneName: '完成',
  onConfirm: null,
  openInsert(d, btype) {
    this.type = btype; // 1收入 2支出
    this.tid = d.id;
    this.name = '';
    this.money = '0';
    // this.day = new Date().format('yyyy-MM-dd');
    this.doneName = '完成';
    this.defaultInputName = d.n;
    this.show = true;
    this.onConfirm = () => {
      const api = this.type === 1 ? 'api/income' : 'api/accountBook';
      request(
        api,
        {
          info: 'insert',
          tid: this.tid,
          n: this.name || this.defaultInputName,
          m: Number(this.money) * 100,
          d: this.day,
        },
        toLoading,
      ).then(e => {
        if (e.tip === 1) {
          this.show = false;
          typeSelect.show = false;
          ui.activeTab = '1';
          accountBook.showByMonth();
        } else {
          showToast(e.d || '保存失败');
        }
      });
    };
  },
  openEdit(d) {
    this.name = d.n;
    this.money = String(d.m / 100);
    this.day = new Date(d.d).format('yyyy-MM-dd');
    this.doneName = '完成';
    this.defaultInputName = d.n;
    this.tid = d.id;
    this.type = d.tt;
    this.show = true;
    this.onConfirm = () => {
      const api = this.type === 1 ? 'api/income' : 'api/accountBook';
      request(
        api,
        {
          info: 'update_detail',
          id: this.tid,
          n: this.name || this.defaultInputName,
          m: Number(this.money) * 100,
          d: this.day,
        },
        toLoading,
      ).then(e => {
        if (e.tip === 1) {
          this.show = false;
          accountBook.showByMonth();
        } else {
          showToast(e.d || '更新失败');
        }
      });
    };
  },
  pickDay() {
    datePicker.open({
      type: 'date',
      min: new Date(2020, 1, 1),
      max: new Date(),
      value: new Date(this.day),
      confirm: () => {
        datePicker.type = 'date';
        this.day = datePicker.value.format('yyyy-MM-dd');
      },
    });
  },
  doConfirm() {
    if (Number(this.money) === 0 || this.money === '') {
      showToast('请填写金额');
      return;
    }
    if (typeof this.onConfirm === 'function') this.onConfirm();
  },
  clickNumber(d) {
    let str = '' + this.money; // 兼容数字态（统一字符串处理）
    const num = Number(str);
    const hasAdd = str.indexOf('+') > -1;
    const hasMinus = str.indexOf('-') > -1;
    let testPointStr = str;
    if (hasAdd) testPointStr = str.split('+')[1];
    if (hasMinus) testPointStr = str.split('-')[1];
    const hasPoint = testPointStr.indexOf('.') > -1;
    const last = str.charAt(str.length - 1);
    const hasSymbol = hasAdd || hasMinus;
    const lastSymbol = last == '-' || last == '+';
    this.doneName = hasSymbol && !lastSymbol ? '=' : '完成';

    if (d == '-' || d == '+') {
      if (hasSymbol) {
        if (lastSymbol) {
          this.money = str.substr(0, str.length - 1) + '' + d;
        } else {
          str = new Function('return ' + str)();
          str = Number(str).toFixed(2);
          this.money = str + '' + d;
        }
      } else {
        this.money = str + '' + d;
      }
      this.doneName = '完成';
    }
    if (d == 'date') {
      this.pickDay();
    }
    if (d == 'delete') {
      if (str.length == 1) {
        this.money = '0';
        this.doneName = '完成';
      } else {
        this.money = str.substr(0, str.length - 1);
      }
      if (hasSymbol) {
        const __last = this.money.charAt(this.money.length - 1);
        this.doneName = __last == '-' || __last == '+' ? '完成' : '=';
      } else {
        this.doneName = '完成';
      }
    }
    if (d == 'done') {
      if (lastSymbol) str = str + '0';
      this.money = new Function('return ' + str)();
      this.money = Number(this.money).toFixed(2);
      if (this.doneName == '完成') {
        this.doConfirm();
      } else {
        this.doneName = '完成';
      }
    }
    if (d == '.') {
      if (!hasPoint) {
        this.money = last == '-' || last == '+' ? str + '0' + d : str + '' + d;
      }
      this.doneName = hasSymbol ? '=' : '完成';
    }
    if (typeof d == 'number') {
      this.money = num === 0 && !hasPoint ? '' + d : str + '' + d;
      this.doneName = hasSymbol ? '=' : '完成';
    }
  },
});

/* ------------------------------------------------------------------ */
/* typeSelect 类型选择弹层（记一笔 / 修改类型 / 添加预算）                */
/* ------------------------------------------------------------------ */
export const typeSelect = reactive({
  show: false,
  title: ['支出', '收入'],
  next: 'insert', // 'insert' | 'changeType' | 'payBudget'
  before: null,
  activeTab: 'pay',
  hideIndexGroup: [], // 预算场景下隐藏"已做预算"的支出小类索引
  smallList: [],
  smallIndex: -1,
  bigList: [],
  bigIndex: -1,
  open({ title, next, before, initTab }) {
    this.show = true;
    this.title = title || ['支出', '收入'];
    this.next = next || 'insert';
    this.before = before || null;
    this.smallIndex = -1;
    this.bigIndex = -1;
    this.hideIndexGroup = [];
    this.initList(initTab || 'pay');
  },
  initList(name) {
    this.activeTab = name;
    if (name === 'pay') {
      if (this.smallList.length === 0) {
        this.loadPayTypes();
      } else {
        this.computeHideIndex();
      }
    } else if (this.bigList.length === 0) {
      this.loadIncomeTypes();
    }
  },
  loadPayTypes() {
    request('api/smallType', { info: 'select_pay' }, toLoading).then(e => {
      ui.refreshing = false;
      if (e.tip === 1) {
        this.smallList = e.d;
        this.computeHideIndex();
      }
    });
  },
  loadIncomeTypes() {
    request('api/bigType', { info: 'select_income' }, toLoading).then(e => {
      ui.refreshing = false;
      if (e.tip === 1) {
        this.bigList = e.d;
      }
    });
  },
  computeHideIndex() {
    if (this.title[0] === '预算') {
      const hid = [];
      this.smallList.forEach((item, i) => {
        const finder = payBudget.list.small.find(e => e.sid === item.id);
        if (finder) hid.push(i);
      });
      this.hideIndexGroup = hid;
    } else {
      this.hideIndexGroup = [];
    }
  },
  onTypeSelected(d, i, btype) {
    if (btype === 1) {
      this.bigIndex = i;
    } else {
      this.smallIndex = i;
    }
    if (this.next === 'insert') keyboard.openInsert(d, btype);
    if (this.next === 'changeType') this.modifyRecordType(d);
    if (this.next === 'payBudget') this.addPayBudget(d);
  },
  // 修改分类：同收支性质直接改类型，否则"新增一条 + 删除原记录"
  modifyRecordType(d) {
    const beforeData = this.before;
    if (!beforeData) return;
    if (beforeData.tt === d.t) {
      const api = beforeData.tt == 1 ? 'api/income' : 'api/accountBook';
      request(api, { info: 'update_type', id: beforeData.id, tid: d.id }, toLoading).then(
        e => {
          typeSelect.show = false;
          if (typeof e.d === 'string') {
            showToast(e.d);
          } else if (e.tip === 1) {
            showToast('分类修改成功');
          }
          accountBook.showByMonth();
        },
      );
    } else {
      const insertApi = d.t == 1 ? 'api/income' : 'api/accountBook';
      const deleteApi = beforeData.tt == 1 ? 'api/income' : 'api/accountBook';
      request(
        insertApi,
        { info: 'insert', tid: d.id, n: beforeData.n, m: beforeData.m, d: beforeData.d },
        toLoading,
      ).then(e => {
        if (e.tip === 1) {
          request(deleteApi, { info: 'delete', id: beforeData.id }, toLoading).then(() => {
            typeSelect.show = false;
            showToast('分类修改为 ' + d.n + ' 成功');
            accountBook.showByMonth();
          });
        } else {
          typeSelect.show = false;
          showToast(e.d || '修改失败');
        }
      });
    }
  },
  addPayBudget(d) {
    const finder = payBudget.list.small.findIndex(e => e.sid === d.id);
    if (finder > -1) {
      showToast('此分类已做预算');
      return;
    }
    prompt.go(payBudget.list.d + ' ' + d.n + '的预算/元', v => {
      request(
        'api/payBudget',
        { info: 'insert', tid: d.id, m: Number(v) * 100, d: new Date().format('yyyy-MM') },
        toLoading,
      ).then(e => {
        typeSelect.show = false;
        if (e.tip === 1) {
          payBudget.refresh();
          showToast('预算设置成功');
        } else {
          showToast(e.d || '设置失败');
        }
      });
    });
  },
  payTab() {
    this.initList('pay');
  },
  incomeTab() {
    this.initList('income');
  },
});

/* ------------------------------------------------------------------ */
/* chart 图表页（自绘 canvas 环形图 + 明细关联）                          */
/* ------------------------------------------------------------------ */
export const chart = reactive({
  type: 'week', // week | month | year
  time: new Date().format('yyyy-w+'),
  timeList: [],
  visibleType: 'type', // type | detail
  selectTypeId: 0,
  detailList: [], // 当前时间段全部支出明细
  isBig: true, // detail 视图按大类(true)聚合，type 视图按小类=false
  bigTypeConfig: { sum: 0, list: [], isTime: false },
  smallTypeConfig: { sum: 0, list: [], isTime: false },
  detailConfig: { sum: 0, list: [], isTime: true },
  buildTimeList() {
    this.timeList = [];
    const thisYear = new Date().format('yyyy');
    if (this.type === 'week') {
      const today = Number(new Date().format('w'));
      for (let i = 0; i < 20; i++) {
        const v = today - i;
        if (v <= 0) break;
        this.timeList.push({
          title: i === 0 ? '本周' : i === 1 ? '上周' : v + '周',
          value: thisYear + '-' + (v < 10 ? '0' + v : '' + v),
        });
      }
    }
    if (this.type === 'month') {
      const today = Number(new Date().format('MM'));
      for (let i = 0; i < 12; i++) {
        const v = today - i;
        if (v <= 0) break;
        this.timeList.push({
          title: i === 0 ? '本月' : i === 1 ? '上月' : v + '月',
          value: thisYear + '-' + (v < 10 ? '0' + v : '' + v),
        });
      }
    }
    if (this.type === 'year') {
      const today = thisYear;
      for (let i = 0; i < 3; i++) {
        const v = Number(today) - i;
        if (v <= 0) break;
        this.timeList.push({ title: i === 0 ? '今年' : i === 1 ? '去年' : '' + v, value: v + '' });
      }
    }
    this.time = this.timeList.length ? this.timeList[0].value : '';
    this.showDetail();
  },
  // selectPayDetailByTime 聚合为 小类/大类 配置
  // 去重策略：
  // 1. 时段合法性：chart.time 必须属于当前 timeList，否则是切换类型瞬间 Vant 回发的
  //    旧列表过渡值（如 month 列表里残留的 2026-33 / 2026-33+），直接丢弃不请求；
  // 2. 在途去重：相同 type|time 的请求尚未完成时不再发出第二次（buildTimeList 直接调用
  //    与 time watcher 触发的同一请求只保留一份）；
  // 3. 序列号：并发请求只允许最新一次响应写入，避免旧响应后到覆盖新数据。
  _fetchSeq: 0,
  _fetchInFlight: '',
  showDetail() {
    const key = this.type + '|' + this.time;
    if (!this.timeList.some(t => t.value === this.time)) return;
    if (key === this._fetchInFlight) return;
    this._fetchInFlight = key;
    const seq = ++this._fetchSeq;
    request('api/accountBook', { info: 'selectPayDetailByTime', t: this.type, d: this.time }, toLoading)
      .then(e => {
        ui.refreshing = false;
        if (seq !== this._fetchSeq) return;
        if (e.tip === 1) {
          this.detailList = [].concat(e.d.d);
          const smallTypeTemp = [];
          const bigTypeTemp = [];
          this.detailList.forEach(item => {
            const detail = Object.assign({}, item);
            const si = smallTypeTemp.findIndex(f => f.tid === detail.tid);
            if (si === -1) {
              detail.n = detail.tn;
              detail.tn = detail.bn;
              smallTypeTemp.push(detail);
            } else {
              const j = Object.assign({}, smallTypeTemp[si]);
              j.m = Number(j.m) + Number(detail.m);
              smallTypeTemp[si] = j;
            }
            const detail2 = Object.assign({}, item);
            const bi = bigTypeTemp.findIndex(f => f.tid === detail2.bid);
            if (bi === -1) {
              detail2.n = detail2.bn;
              detail2.tn = detail2.bn;
              detail2.tid = detail2.bid;
              bigTypeTemp.push(detail2);
            } else {
              const j = Object.assign({}, bigTypeTemp[bi]);
              j.m = Number(j.m) + Number(detail2.m);
              bigTypeTemp[bi] = j;
            }
          });
          smallTypeTemp.sort((a, b) => b.m - a.m);
          bigTypeTemp.sort((a, b) => b.m - a.m);
          this.smallTypeConfig.list = [].concat(smallTypeTemp);
          this.smallTypeConfig.sum = e.d.sum;
          this.bigTypeConfig.list = [].concat(bigTypeTemp);
          this.bigTypeConfig.sum = e.d.sum;
          this.selectTypeId = 0;
        }
      })
      .finally(() => {
        if (seq === this._fetchSeq) this._fetchInFlight = '';
      });
  },
  // 选中图形后：展示对应聚合项下的小类/大类明细（依据 isBig）
  initDetailList(newList, ntid) {
    const temp = (newList || []).filter(e => (this.isBig ? e.bid == ntid : e.tid == ntid));
    this.detailConfig.list = [].concat(temp);
    let sum = 0;
    this.detailConfig.list.forEach(e => {
      sum += Number(e.m);
    });
    this.detailConfig.sum = sum;
    this.detailConfig.isTime = true;
  },
  // 图表/分组列表点击 → 切到明细视图
  selectEntry(d) {
    this.selectTypeId = d.tid;
    this.visibleType = 'detail';
  },
  backToType() {
    this.visibleType = 'type';
  },
  // 生成 echarts 数据（按日期折线）
  genChartSource() {
    const source = [];
    let oldList = [].concat(this.detailList);
    if (this.visibleType === 'detail') {
      oldList = [].concat(this.detailConfig.list);
    }
    oldList.forEach(e => {
      const t = Object.assign({}, e);
      if (this.type === 'year') {
        t.groupby = new Date(e.d).format('yyyy-MM');
        t.groupshow = new Date(e.d).format('MM');
      } else {
        t.groupby = new Date(e.d).format('yyyy-MM-dd');
        t.groupshow = new Date(e.d).format('MM-dd');
      }
      const f = source.findIndex(s => s.groupby === t.groupby);
      if (f === -1) {
        source.push(t);
      } else {
        const j = Object.assign({}, source[f]);
        j.m = Number(j.m) + Number(t.m);
        source[f] = j;
      }
    });
    source.sort((a, b) => new Date(a.d) - new Date(b.d));
    return source;
  },
});

// TEMP-DEBUG: expose store for browser-side inspection
if (typeof window !== 'undefined') {
  window.__store = window.__store || {};
  window.__store.chart = chart;
}

/* ------------------------------------------------------------------ */
/* payBudget 预算页                                                    */
/* ------------------------------------------------------------------ */
export const payBudget = reactive({
  list: {
    d: new Date().format('yyyy-MM'),
    m: 0,
    pm: 0,
    lm: 0,
    percent: 0,
    visible: false,
    small: [],
    big: [],
  },
  typeIsSmallOrBig: 'small', // 当前展示 小类(small) / 大类(big)
  // 明细弹层（按预算项看其当月支出明细）
  detail: { show: false, sum: 0, list: [], current: null },
  // 大类弹层（查看大类下的小类预算）
  smallDetail: { show: false, list: [] },
  refresh() {
    request('api/payBudget', { info: 'select_by_month', month: this.list.d }, toLoading).then(
      e => {
        ui.refreshing = false;
        this.list.visible = false;
        if (e.tip === 1) {
          const bigTemp = [];
          const smallTemp = [].concat(e.d);
          let m = 0;
          let lm = 0;
          let pm = 0;
          e.d.forEach(item => {
            const detail = Object.assign({}, item);
            m += Number(detail.m);
            lm += Number(detail.lm);
            pm += Number(detail.pm);
            const ti = bigTemp.findIndex(f => f.bid === detail.bid);
            if (ti === -1) {
              detail.sn = detail.bn;
              bigTemp.push(detail);
            } else {
              const j = Object.assign({}, bigTemp[ti]);
              j.m = Number(j.m) + Number(detail.m);
              j.lm = Number(j.lm) + Number(detail.lm);
              j.pm = Number(j.pm) + Number(detail.pm);
              bigTemp[ti] = j;
            }
          });
          this.list.big = [].concat(bigTemp);
          this.list.small = [].concat(smallTemp);
          this.list.m = m;
          this.list.lm = lm;
          this.list.pm = pm;
        }
        this.list.percent =
          this.list.m > 0 ? Number((this.list.lm / this.list.m) * 100).toFixed(0) : 0;
        this.list.visible = true;
      },
    );
  },
  showByMonth() {
    if (this.list.small.length === 0) this.refresh();
  },
  copy() {
    request(
      'api/payBudget',
      { info: 'copy_by_month', month: new Date(this.list.d).format('yyyy-MM') },
      toLoading,
    ).then(() => {
      ui.refreshing = false;
      this.refresh();
    });
  },
  changeSort(key) {
    const temp = [].concat(this.list[this.typeIsSmallOrBig]);
    temp.sort((a, b) => b[key] - a[key]);
    this.list[this.typeIsSmallOrBig] = [].concat(temp);
  },
  switchType() {
    this.typeIsSmallOrBig = this.typeIsSmallOrBig === 'big' ? 'small' : 'big';
  },
  showDate() {
    datePicker.open({
      type: 'year-month',
      min: new Date(2020, 1, 1),
      max: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      value: new Date(this.list.d),
      confirm: () => {
        datePicker.type = 'date';
        this.list.d = datePicker.value.format('yyyy-MM');
        this.refresh();
      },
    });
  },
  add() {
    this.detail.show = false;
    this.smallDetail.show = false;
    typeSelect.open({ title: ['预算', ''], next: 'payBudget', initTab: 'pay' });
  },
  delete(d) {
    let ids = '';
    if (this.typeIsSmallOrBig === 'big') {
      const idsArray = [];
      this.list.small.forEach(e => {
        if (e.bid === d.bid) idsArray.push(e.id);
      });
      ids = idsArray.join(',');
    } else {
      ids = d.id;
    }
    request('api/payBudget', { info: 'delete', ids }, toLoading).then(e => {
      showToast(e.d || '已删除');
      this.refresh();
    });
  },
  update(d) {
    prompt.go(d.d + ' ' + d.sn + '的预算/元', v => {
      request('api/payBudget', { info: 'update_detail', id: d.id, m: Number(v) * 100, d: d.d }, toLoading).then(
        e => {
          typeSelect.show = false;
          if (e.tip === 1) {
            this.refresh();
            showToast('预算更新成功');
          } else {
            showToast(e.d || '更新失败');
          }
        },
      );
    });
  },
  toUpdate(d) {
    if (this.typeIsSmallOrBig === 'big') {
      showToast('只能设置小类的预算');
      return;
    }
    this.update(d);
  },
  showEntryDetail(d) {
    if (this.typeIsSmallOrBig === 'big') {
      this.smallDetail.list = [].concat(this.list.small.filter(e => e.bid === d.bid));
      this.smallDetail.show = true;
    } else {
      this.showTypeDetail(d);
    }
  },
  showTypeDetail(d) {
    this.detail.current = d;
    request(
      'api/accountBook',
      { info: 'selectPayDetailBySidAndTime', id: d.sid, t: 'month', d: new Date(d.d).format('yyyy-MM') },
      toLoading,
    ).then(e => {
      if (e.tip === 1) {
        this.detail.sum = e.d.sum;
        this.detail.list = [].concat(e.d.d);
        this.detail.show = true;
      } else {
        showToast(e.d || '暂无明细');
      }
    });
  },
});
/* ------------------------------------------------------------------ */
/* myBill 年度账单                                                     */
/* ------------------------------------------------------------------ */
export const myBill = reactive({
  year: new Date().format('yyyy'),
  list: [],
  lbudget: 0,
  budget: 0,
  pay: 0,
  income: 0,
  lincome: 0,
  get() {
    request('api/accountBook', { info: 'selectBillByYear', year: this.year }, toLoading).then(
      e => {
        ui.refreshing = false;
        if (e.tip === 1) {
          this.list = [].concat(e.d.d);
          this.lbudget = e.d.lbudget;
          this.budget = e.d.budget;
          this.pay = e.d.pay;
          this.income = e.d.income;
          this.lincome = e.d.lincome;
        }
      },
    );
  },
  setYear() {
    datePicker.open({
      type: 'year-month',
      min: new Date(2000, 1, 1),
      max: new Date(),
      value: new Date(),
      confirm: () => {
        datePicker.type = 'date';
        this.year = datePicker.value.format('yyyy');
        this.get();
      },
    });
  },
});
