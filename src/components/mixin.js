var clientHeight = document.documentElement.clientHeight;
var clientWidth = document.documentElement.clientWidth;
import * as echarts from 'echarts';
import { http, DEFAULT_SEARCH } from './utils';
import ComponentTypeList from './ComponentTypeList.vue';
import ComponentPaybudgetList from './ComponentPaybudgetList.vue';
import ComponentPaydetailList from './ComponentPaydetailList.vue';

export default {
  name: 'App',

  components: {
    ComponentTypeList,
    ComponentPaybudgetList,
    ComponentPaydetailList,
  },
  data() {
    return {
      loadingCount: 0,
      datePicker: {
        show: false,
        type: 'date',
        min: new Date(2020, 0, 1),
        max: new Date(2025, 10, 1),
        value: new Date(),
        confirm: () => {
          this.datePicker.show = false;
        },
      },
      refreshing: false,
      minClientHeight: clientHeight - 50,

      accountBookMonthList_month: new Date().format('yyyy-MM'),
      accountBookMonthList: [],

      chart: {
        type: '',
        time: new Date().format('yyyy-w+'),
        timeList: [],
        visibleType: 'type',
        selectTypeId: 0,
        detailList: [],
        isBig: true,
        bigTypeConfig: {
          sum: 0,
          list: [],
          isTime: false,
          click: d => {
            this.chart.selectTypeId = d.tid;
            this.chart.visibleType = 'detail';
            console.log('select sid :', d.tid);
          },
        },
        smallTypeConfig: {
          sum: 0,
          list: [],
          isTime: false,
          click: d => {
            this.chart.selectTypeId = d.tid;
            this.chart.visibleType = 'detail';
            console.log('select sid :', d.tid);
          },
        },
        detailConfig: {
          sum: 0,
          list: [],
          isTime: true,
        },
      },
      // 弹出的明细
      payBudgetMonthListTypeDetail: {
        show: false,
        config: {
          sum: 0,
          list: [],
          isTime: true,
        },
      },
      // 弹出的小类
      payBudgetMonthListSmallDetail: {
        show: false,
        config: {
          list: [],
          right: {
            show: false,
            text: '',
            click: () => {},
          },
          item: {
            clickPayBudget: this.updatePayBudget,
            click: this.showAccountBookDetailByTypeFn,
          },
        },
      },
      payBudgetMonthList: {
        currentRate: 0,
        visible: false,
        percent: 0,
        small: [],
        big: [],
        d: new Date().format('yyyy-MM'),
        m: 0,
        pm: 0,
        lm: 0,
      },
      pay_budget_type_is_small_or_big: 'small', //1

      selectTypePopup: {
        title: ['支出', '收入'],
        hideIndexGroup: [],
        show: false,
        activeTab: 'pay',
        before: null, //数据暂存
        next: 'insert', // ''changeType'
        onClose: () => {
          console.log(arguments);
        },
      },
      typesTabsVisible: false,
      smallPayTypesList: [],
      smallPayTypesListSelectIndex: -1,
      bigIncomeTypesList: [],
      bigIncomeTypesListSelectIndex: -1,

      myBill: {
        year: new Date().format('yyyy'),
        list: [],
        lbudget: 0,
        budget: 0,
        pay: 0,
        income: 0,
        lincome: 0,
        setYearFn: () => {
          this.datePicker.type = 'year-month';
          this.datePicker.max = new Date();
          this.datePicker.min = new Date(2000, 1, 1);
          this.datePicker.value = new Date();
          this.datePicker.show = true;
          this.datePicker.confirm = () => {
            this.datePicker.show = false;
            this.datePicker.type = 'date';
            this.myBill.year = this.datePicker.value.format('yyyy');
            this.myBill.getBillFn();
          };
        },
        getBillFn: () => {
          this.http('api/accountBook', {
            info: 'selectBillByYear',
            year: this.myBill.year,
          }).then(e => {
            this.refreshing = false;
            this.myBill.list = [].concat(e.d.d);
            this.myBill.lbudget = e.d.lbudget;
            this.myBill.budget = e.d.budget;
            this.myBill.pay = e.d.pay;
            this.myBill.income = e.d.income;
            this.myBill.lincome = e.d.lincome;
          });
        },
      },

      activeTabBar: '1',

      keyboard: {
        show: false,
        type: 2, // 1收2支
        tid: 0, //类id
        name: '',
        money: '0.00',
        day: '2020-10-01',
        defaultInputName: '',
        doneName: '完成',
        onClose: () => {
          console.log(arguments);
        },
        onConfirmFn: () => {
          if (this.keyboard.money == 0 || this.keyboard.money == '') {
            vant.Toast('请填写金额');
            return;
          }
          this.keyboard.onConfirmCallBackFn();
        },
        onConfirmCallBackFn() {
          console.log(this.keyboard);
          this.keyboard.show = false;
        },
        clickNumber: d => {
          console.log(d, typeof d);
          let str = this.keyboard.money;
          let num = Number(str);

          let hasAdd = str.indexOf('+') > -1;
          let hasMinus = str.indexOf('-') > -1;

          let testPointStr = str;
          if (hasAdd) {
            testPointStr = str.split('+')[1];
          }
          if (hasMinus) {
            testPointStr = str.split('-')[1];
          }
          let hasPoint = testPointStr.indexOf('.') > -1;

          let last = str.charAt(str.length - 1);
          let hasSymbol = hasAdd || hasMinus;
          let lastSymbol = last == '-' || last == '+';
          if (hasSymbol && !lastSymbol) {
            this.keyboard.doneName = '=';
          } else {
            this.keyboard.doneName = '完成';
          }

          if (d == '-' || d == '+') {
            if (hasSymbol) {
              if (lastSymbol) {
                this.keyboard.money = str.substr(0, str.length - 1) + '' + d;
              } else {
                str = new Function('return ' + str)();
                str = str.toFixed(2);
                this.keyboard.money = str + '' + d;
              }
            } else {
              this.keyboard.money = str + '' + d;
            }

            this.keyboard.doneName = '完成';
          }
          if (d == 'date') {
            this.datePicker.max = new Date();
            this.datePicker.min = new Date(2020, 1, 1);
            // this.datePicker.value = new Date();
            this.datePicker.show = true;
            this.datePicker.confirm = () => {
              this.datePicker.show = false;
              this.keyboard.day = this.datePicker.value.format('yyyy-MM-dd');
            };
          }
          if (d == 'delete') {
            if (str.length == 1) {
              this.keyboard.money = '0';
              this.keyboard.doneName = '完成';
            } else {
              this.keyboard.money = str.substr(0, str.length - 1);
            }
            if (hasSymbol) {
              let __last = this.keyboard.money.charAt(this.keyboard.money.length - 1);
              if (__last == '-' || __last == '+') {
                this.keyboard.doneName = '完成';
              } else {
                this.keyboard.doneName = '=';
              }
            } else {
              this.keyboard.doneName = '完成';
            }
          }
          if (d == 'done') {
            if (lastSymbol) {
              str = str + '' + '0';
            }
            this.keyboard.money = new Function('return ' + str)();
            this.keyboard.money = this.keyboard.money.toFixed(2);
            if (this.keyboard.doneName == '完成') {
              this.keyboard.onConfirmFn();
            } else {
              this.keyboard.doneName = '完成';
            }
          }
          if (d == '.') {
            if (!hasPoint) {
              if (last == '-' || last == '+') {
                this.keyboard.money = str + '0' + d;
              } else {
                this.keyboard.money = str + '' + d;
              }
            }
            if (hasSymbol) {
              this.keyboard.doneName = '=';
            } else {
              this.keyboard.doneName = '完成';
            }
          }
          if (typeof d == 'number') {
            if (num === 0 && !hasPoint) {
              this.keyboard.money = d;
            } else {
              this.keyboard.money = str + '' + d;
            }

            if (hasSymbol) {
              this.keyboard.doneName = '=';
            } else {
              this.keyboard.doneName = '完成';
            }
          }
        },
      },
      popup: {
        required: true,
        label: '',
        placeholder: '请输入',
        list: [],
        selectIndex: -1,
        value: '',
        show: false,
        onClose: () => {
          console.log(arguments);
        },
        onConfirmFn: () => {
          if (this.popup.list.length == 0) {
            vant.Toast('无数据');
            this.popup.show = false;
            return;
          }
          if (this.popup.selectIndex < 0) {
            vant.Toast('请点击选择归属类别');
            return;
          }
          let d = this.popup.list[this.popup.selectIndex];
          if (!d) {
            vant.Toast('无效选择');
            return false;
          }
          let id = d.id;
          let v = this.popup.value;

          if (this.popup.required) {
            if (!v && v != '0') {
              this.$toast('请填写');
              return false;
            }
          }
          if (typeof this.popup.onConfirmCallBackFn == 'function') {
            this.popup.onConfirmCallBackFn(id, v);
          }
        },
        onConfirmCallBackFn: (id, v) => {
          console.log(arguments);
          this.popup.show = false;
        },
      },
      // prompt 输入框
      prompt: {
        title: '请输入',
        label: '',
        placeholder: '请输入',
        value: '',
        show: false,
        required: true,
        onBeforeClose: (action, done) => {
          if (action == 'confirm') {
            if (this.prompt.required) {
              if (!this.prompt.value && this.prompt.value != '0') {
                this.$toast('请填写');
                done(false);
                return false;
              }
            }
            if (typeof this.prompt.onConfirm == 'function') {
              this.prompt.onConfirm(this.prompt.value);
            }
          }
          if (action == 'cancel') {
            if (typeof this.prompt.onClose == 'function') {
              this.prompt.onClose();
            }
          }
          done();
        },
        onConfirm: () => {},
        onClose: () => {
          this.prompt.show = false;
        },
        go: (title, cb) => {
          this.prompt.show = false;
          this.prompt.title = '请输入';
          this.prompt.label = '';
          this.prompt.placeholder = '请输入';
          this.prompt.value = '';
          this.prompt.onConfirm = null;
          this.prompt.show = true;
          this.prompt.title = title;
          if (typeof cb == 'function') {
            this.prompt.onConfirm = cb;
          } else {
            console.log('没有回调');
          }
        },
      },
      // loading 效果
      loading: false,
      myChart: null,
      // 搜索
      search: {
        visible: false,
        data: DEFAULT_SEARCH(),
      },
    };
  },
  watch: {
    'chart.selectTypeId': {
      handler(nid) {
        console.log('chart.selectTypeId', nid);
        if (nid) this.initAccountBookDetailList(this.chart.detailList, nid);
      },
    },
    'chart.detailList': {
      handler(newList) {
        console.log('chart.detailList', newList);
        if (newList) this.initAccountBookDetailList(newList, this.chart.selectTypeId);
      },
    },
    'chart.visibleType'(n) {
      this.myChartInit();
    },
    'chart.type'(newType, oldType) {
      console.log('new chart.type ', newType);
      this.chart.timeList = [];
      let thisYear = new Date().format('yyyy');
      switch (newType) {
        case 'week':
          {
            let todayValue = new Date().format('w');
            for (let i = 0; i < 20; i++) {
              let v = Number(todayValue) - i;
              if (v <= 0) break;
              let t = i == 0 ? '本周' : i == 1 ? '上周' : v + '周';
              let __json = {
                title: t,
                value: thisYear + '-' + (v < 10 ? '0' + v : v),
              };
              this.chart.timeList.push(__json);
            }
            console.log(this.chart.timeList);
          }
          break;
        case 'month':
          {
            let todayValue = new Date().format('MM');
            for (let i = 0; i < 12; i++) {
              let v = Number(todayValue) - i;
              if (v <= 0) break;
              let t = i == 0 ? '本月' : i == 1 ? '上月' : v + '月';
              let __json = {
                title: t,
                value: thisYear + '-' + (v < 10 ? '0' + v : v),
              };
              this.chart.timeList.push(__json);
            }
          }
          console.log(this.chart.timeList);
          break;
        case 'year':
          {
            let todayValue = thisYear;
            for (let i = 0; i < 3; i++) {
              let v = Number(todayValue) - i;
              if (v <= 0) break;
              let t = i == 0 ? '今年' : i == 1 ? '去年' : v + '年';
              let __json = {
                title: t,
                value: v,
              };
              this.chart.timeList.push(__json);
            }
            console.log(this.chart.timeList);
          }
          break;
        default:
      }
      this.$nextTick(e => {
        this.chart.time = this.chart.timeList[0].value;
      });
    },
    'chart.time'(newType, oldType) {
      this.showAccountBookDetailByTimeFn();
    },
  },
  computed: {
    title() {
      let title = '阿布记账';
      switch (this.activeTabBar) {
        case '1':
          title = '阿布的每月明细';
          break;
        case '2':
          title = '阿布的统计图表';
          break;
        case '3':
          break;
        case '4':
          title = '阿布的每月预算';
          break;
        case '5':
          title = '阿布的年度账单';
          break;
        default:
          title = '阿布记账';
      }
      return title;
    },
    c_payBudgetConfig() {
      return {
        list: this.c_payBudgetMonthList,
        right: {
          show: true,
          text: '删除',
          click: this.deletePayBudgetMonthListDetailFn,
        },
        item: {
          clickPayBudget: this.toUpdatePayBudget,
          click: this.showPayBudgetMonthListDetailFn,
        },
      };
    },
    c_payBudgetMonthList() {
      return this.payBudgetMonthList[this.pay_budget_type_is_small_or_big];
    },
    c_accountBookMonthList_GroupByDay() {
      let groupJson = {};
      let shouru = 0;
      let zhichu = 0;
      let l = this.accountBookMonthList.length;
      for (let i = 0, l = this.accountBookMonthList.length; i < l; i++) {
        let e = this.accountBookMonthList[i];
        if (e.tt == 1) {
          shouru += Number(e.m);
        }
        if (e.tt == 2) {
          zhichu += Number(e.m);
        }

        let dateKey = new Date(e.d).format('yyyy年MM月dd日 星期W');
        if (!Object.prototype.hasOwnProperty.call(groupJson, dateKey)) {
          groupJson[dateKey] = {
            sum: [0, 0, 0],
            list: [],
          };
        }
        groupJson[dateKey].sum[e.tt] = Number(groupJson[dateKey].sum[e.tt]) + Number(e.m);
        groupJson[dateKey].list.push(e);
      }
      return {
        data: groupJson,
        zhichu: zhichu,
        shouru: shouru,
      };
    },
  },
  created() {
    console.log('created');
  },
  mounted() {
    // 1收2支

    var chartEle = document.getElementById('myChart');
    if (chartEle) {
      chartEle.style.width = clientWidth + 'px';
      // chartEle.style.height = clientWidth*0.5 + 'px';
    }
    this.myChartCreated();

    this.showAccountBookByMonthFn();
  },
  methods: {
    // loading 效果
    toLoading(flag = true) {
      console.log('toLoading', flag);

      if (flag) {
        this.loadingCount++;
      } else {
        this.loadingCount--;

        if (this.loadingCount < 0) this.loadingCount = 0;
      }

      this.loading = this.loadingCount > 0;
    },
    http(a, b) {
      return http(a, b, this.toLoading);
    },
    myChartCreated() {
      // 基于准备好的dom，初始化echarts实例
      this.myChart = echarts.init(this.$refs.myChart);
      this.myChart.setOption({
        grid: {
          left: -2,
          right: 10,
          top: 10,
          bottom: 20,
          // width: {totalWidth} - x - x2,
          // height: {totalHeight} - y - y2,
          backgroundColor: 'rgba(0,0,0,0)',
          borderWidth: 1,
          borderColor: '#ccc',
        },
        color: ['#FF9966'],
        xAxis: { type: 'category' },
        yAxis: {},
        series: [{ type: 'line' }],
      });
    },
    myChartInit() {
      console.log('this.chart.detailList', JSON.stringify(this.chart.detailList));
      let source = [];
      let oldList = [].concat(this.chart.detailList);
      if (this.chart.visibleType == 'detail') {
        oldList = [].concat(this.chart.detailConfig.list);
      }
      oldList.forEach(e => {
        let tempE = Object.assign({}, e);
        if (this.chart.type == 'year') {
          tempE['groupby'] = new Date(e.d).format('yyyy-MM');
          tempE['groupshow'] = new Date(e.d).format('MM');
        } else {
          tempE['groupby'] = new Date(e.d).format('yyy-MM-dd');
          tempE['groupshow'] = new Date(e.d).format('MM-dd');
        }
        let f = source.findIndex(se => {
          return se.groupby == tempE.groupby;
        });
        if (f == -1) {
          source.push(tempE);
        } else {
          let __json = Object.assign({}, source[f]);
          __json.m = Number(__json.m) + Number(tempE.m);
          source[f] = __json;
        }
      });

      source.sort((a, b) => {
        return new Date(a.d) - new Date(b.d);
      });
      this.myChart.setOption({
        dataset: {
          // 这里指定了维度名的顺序，从而可以利用默认的维度到坐标轴的映射。
          // 如果不指定 dimensions，也可以通过指定 series.encode 完成映射，参见后文。
          dimensions: ['groupshow', 'm'],
          source: source,
        },
      });
    },
    onChangeTabBarFn(index) {
      if (index != '3') {
        this.activeTabBar = index;
      }
      console.log(index);
      switch (index) {
        case '1':
          break;
        case '2':
          if (this.chart.detailList.length == 0) {
            this.showAccountBookDetailByTimeFn();
          }
          if (!this.myChart) {
            this.$nextTick(() => {
              this.myChartCreated();
            });
          }
          break;
        case '3':
          this.selectTypePopup.show = true;
          this.selectTypePopup.title = ['支出', '收入'];
          this.selectTypePopup.next = 'insert';
          // 默认为支出的类型列表
          this.selectTypePopupTabsClickToGetList('pay');
          break;
        case '4':
          this.showPayBudgetByMonthFn();
          break;
        case '5':
          if (this.myBill.list.length == 0) {
            this.myBill.getBillFn();
          }
          break;
        default:
      }
    },
    change_payBudgetMonthList_sort_fn(key) {
      let temp = [].concat(this.payBudgetMonthList[this.pay_budget_type_is_small_or_big]);
      temp.sort((a, b) => {
        return b[key] - a[key];
      });
      this.payBudgetMonthList[this.pay_budget_type_is_small_or_big] = [].concat(temp);
    },
    copyDateFn() {
      this.http('api/payBudget', {
        info: 'copy_by_month',
        month: new Date(this.payBudgetMonthList.d).format('yyyy-MM'),
      }).then(e => {
        this.refreshing = false;
        this.showPayBudgetByMonthFn_refresh();
      });
    },
    showAccountBookMonthSelectFn() {
      this.datePicker.type = 'year-month';
      this.datePicker.max = new Date();
      this.datePicker.min = new Date(2020, 1, 1);
      this.datePicker.value = new Date(this.accountBookMonthList_month);
      this.datePicker.show = true;
      this.datePicker.confirm = () => {
        this.datePicker.show = false;
        this.datePicker.type = 'date';
        this.accountBookMonthList_month = this.datePicker.value.format('yyyy-MM');
        this.showAccountBookByMonthFn();
      };
    },
    showAccountBookByMonthFn(month) {
      if (month) {
        this.accountBookMonthList_month = month;
      }
      this.http('api/accountBook', {
        info: 'select_by_month',
        month: this.accountBookMonthList_month,
      }).then(e => {
        this.refreshing = false;
        if (e.tip == 1) {
          this.accountBookMonthList = e.d;
        }
      });
    },
    /**
     *
     * @param {*} time_type_key  开始时间'st'  结束时间'et'
     */
    showSearchDateSelectFn(time_type_key) {
      this.datePicker.type = 'date';
      this.datePicker.max = new Date();
      this.datePicker.min = new Date(2020, 1, 1);
      this.datePicker.value = null;
      this.datePicker.show = true;
      this.datePicker.confirm = () => {
        this.datePicker.show = false;
        this.datePicker.type = 'date';
        this.search.data[time_type_key] = this.datePicker.value.format('yyyy-MM-dd');
      };
    },
    resetSearch() {
      this.search.data = DEFAULT_SEARCH();
    },
    searchAccountBook() {
      this.http('api/accountBook', {
        info: 'search',
        st: this.search.data.st,
        et: this.search.data.et,
        n: this.search.data.n,
        bn: this.search.data.bn,
        sn: this.search.data.sn,
      }).then(e => {
        this.refreshing = false;
        if (e.tip == 1) {
          this.accountBookMonthList = e.d;
        }
      });
      this.search.visible = false;
    },
    changeAccountBookTypeFn(d) {
      this.selectTypePopup.show = true;
      this.selectTypePopup.title = ['支出', '收入'];
      this.selectTypePopup.next = 'changeType';
      this.selectTypePopup.before = d;
      this.smallPayTypesListSelectIndex = -1;
      this.bigIncomeTypesListSelectIndex = -1;
      this.selectTypePopupTabsClickToGetList(d.tt == 2 ? 'pay' : 'income');
    },
    changeAccountBookDetailFn(d) {
      this.keyboard.name = d.n;
      this.keyboard.money = d.m / 100;
      this.keyboard.day = new Date(d.d).format('yyyy-MM-dd');
      this.keyboard.doneName = '完成';
      this.keyboard.defaultInputName = d.n;
      this.keyboard.value = d.n;
      this.keyboard.show = true;
      this.keyboard.tid = d.id;
      this.keyboard.type = d.tt;
      this.keyboard.onConfirmCallBackFn = () => {
        let api = this.keyboard.type == 1 ? 'api/income' : 'api/accountBook';
        console.log(
          api,
          this.keyboard.tid,
          this.keyboard.name || this.keyboard.defaultInputName,
          this.keyboard.money,
          this.keyboard.day,
        );
        this.http(api, {
          info: 'update_detail',
          id: this.keyboard.tid,
          n: this.keyboard.name || this.keyboard.defaultInputName,
          m: this.keyboard.money * 100,
          d: this.keyboard.day,
        }).then(e => {
          if (e.tip == 1) {
            this.keyboard.show = false;
            this.showAccountBookByMonthFn();
          } else {
            vant.Toast(e.d);
          }
        });
      };
    },
    deleteAccountBookDetailFn(d) {
      let api = d.tt == 1 ? 'api/income' : 'api/accountBook';
      this.http(api, {
        info: 'delete',
        id: d.id,
      }).then(e => {
        if (e.tip == 1) {
          this.showAccountBookByMonthFn();
        }
        vant.Toast(e.d);
      });
    },
    showTypesFn(name, title) {
      this.typesTabsVisible = true;
      this.$nextTick(e => {
        let vm_tab = this.$refs[name];
        if (vm_tab.getList().length == 0) {
          vm_tab.init();
        }
      });
    },
    selectTypePopupTabsClickToGetList(name) {
      this.selectTypePopup.activeTab = name;
      if (name == 'pay') {
        if (this.smallPayTypesList.length == 0) {
          this.showSmallPayTypesFn();
        } else {
          this.hideIndexGroupWhereInsertPayBudget();
        }
      }
      if (name == 'income') {
        if (this.bigIncomeTypesList.length == 0) {
          this.showBigIncomeTypesFn();
        }
      }
    },
    showBigIncomeTypesFn() {
      this.http('api/bigType', {
        info: 'select_income',
      }).then(e => {
        this.refreshing = false;
        if (e.tip == 1) {
          this.bigIncomeTypesList = e.d;
        }
      });
    },
    showSmallPayTypesFn() {
      this.http('api/smallType', {
        info: 'select_pay',
      }).then(e => {
        this.refreshing = false;
        if (e.tip == 1) {
          this.smallPayTypesList = e.d;
          this.hideIndexGroupWhereInsertPayBudget();
        }
      });
    },
    // 在添加预算时 要隐藏已做预算的分类
    hideIndexGroupWhereInsertPayBudget() {
      this.selectTypePopup.hideIndexGroup = [];
      console.log('hideIndexGroup: ' + JSON.stringify(this.selectTypePopup));
      if (this.selectTypePopup.title[0] == '预算') {
        for (let i = 0, l = this.smallPayTypesList.length; i < l; i++) {
          let finder = this.payBudgetMonthList.small.find(e => {
            return e.sid == this.smallPayTypesList[i].id;
          });
          if (finder) {
            this.selectTypePopup.hideIndexGroup.push(i);
          }
        }
        console.log('hideIndexGroup: ' + JSON.stringify(this.selectTypePopup.hideIndexGroup));
      }
    },
    onTypeSelectedFn(d, i, btype) {
      if (btype == 1) {
        //收入 大类选择
        this.bigIncomeTypesListSelectIndex = i;
      } else {
        //支出 小类选择
        this.smallPayTypesListSelectIndex = i;
      }
      if (this.selectTypePopup.next == 'insert') {
        this.showKeyBoardToInsertFn(d, btype);
      }
      if (this.selectTypePopup.next == 'changeType') {
        let beforeData = this.selectTypePopup.before;
        console.log(JSON.stringify(beforeData));
        console.log(JSON.stringify(d));
        let tid;
        if (btype == 1) {
          tid = d.btype;
        }
        let postData = {
          info: 'update_type',
          id: beforeData.id,
          tid: d.id,
        };
        // 修改为同支出/收入类型，直接修改类型id
        if (beforeData.tt == d.t) {
          let api = 'api/accountBook';
          if (d.t == 1) {
            api = 'api/income';
          }
          this.http(api, postData).then(e => {
            this.selectTypePopup.show = false;
            this.showAccountBookByMonthFn();
            if (typeof e.d == 'stirng') {
              vant.Toast(e.d);
            }
          });
        } else {
          // 修改为不同类型，如，支出 变为 收入； 先新增数据再删除
          let deleteApi = beforeData.tt == 1 ? 'api/income' : 'api/accountBook';
          let insertApi = d.t == 1 ? 'api/income' : 'api/accountBook';
          this.http(insertApi, {
            info: 'insert',
            tid: d.id,
            n: beforeData.n,
            m: beforeData.m,
            d: beforeData.d,
          }).then(e => {
            if (e.tip == 1) {
              this.http(deleteApi, {
                info: 'delete',
                id: beforeData.id,
              }).then(e => {
                this.selectTypePopup.show = false;
                this.showAccountBookByMonthFn();
                vant.Toast('分类修改为 ' + d.n + ' 成功');
              });
            } else {
              this.selectTypePopup.show = false;
              vant.Toast(e.d);
            }
          });
        }
      }
      if (this.selectTypePopup.next == 'payBudget') {
        let finder = this.payBudgetMonthList.small.findIndex(e => {
          return e.sid == d.id;
        });
        console.log(finder);
        if (finder > -1) {
          vant.Toast('此分类已做预算');
          return;
        } else {
          this.prompt.go(this.payBudgetMonthList.d + ' ' + d.n + '的预算/元', v => {
            let postDataJson = {
              info: 'insert',
              tid: d.id,
              m: v * 100,
              d: new Date().format('yyyy-MM'),
            };
            this.http('api/payBudget', postDataJson).then(e => {
              this.selectTypePopup.show = false;
              if (e.tip == 1) {
                this.showPayBudgetByMonthFn_refresh();
              }
            });
          });
        }
      }
    },
    showPayBudgetByMonthFn() {
      if (this.payBudgetMonthList.small.length == 0) {
        this.showPayBudgetByMonthFn_refresh();
      }
    },
    showPayBudgetByMonthFn_refresh() {
      let postDataJson = {
        info: 'select_by_month',
        month: this.payBudgetMonthList.d,
      };

      this.http('api/payBudget', postDataJson).then(e => {
        this.refreshing = false;
        this.payBudgetMonthList.visible = false;
        if (e.tip == 1) {
          let bigTemp = [];
          let smallTemp = [].concat(e.d);
          let m = 0,
            lm = 0,
            pm = 0;

          e.d.forEach(item => {
            let detail = Object.assign({}, item);
            m += Number(detail.m);
            lm += Number(detail.lm);
            pm += Number(detail.pm);
            const FIND_INDEX = bigTemp.findIndex(findOne => {
              return findOne.bid == detail.bid;
            });
            if (FIND_INDEX == -1) {
              detail.sn = detail.bn;
              bigTemp.push(detail);
            } else {
              let __json = Object.assign({}, bigTemp[FIND_INDEX]);
              __json.m = Number(__json.m) + Number(detail.m);
              __json.lm = Number(__json.lm) + Number(detail.lm);
              __json.pm = Number(__json.pm) + Number(detail.pm);
              bigTemp[FIND_INDEX] = __json;
            }
          });
          this.payBudgetMonthList.big = [].concat(bigTemp);
          this.payBudgetMonthList.small = [].concat(smallTemp);

          this.payBudgetMonthList.m = m;
          this.payBudgetMonthList.lm = lm;
          this.payBudgetMonthList.pm = pm;
        }
        this.payBudgetMonthList.percent = Number(
          (this.payBudgetMonthList.lm / this.payBudgetMonthList.m) * 100,
        ).toFixed(0);
        this.$nextTick(e => {
          this.payBudgetMonthList.visible = true;
        });
      });
    },
    showKeyBoardToInsertFn(d, type) {
      this.keyboard.type = type; //1收2支
      this.keyboard.tid = d.id; //类id
      this.keyboard.name = '';
      this.keyboard.money = 0;
      this.keyboard.day = new Date().format('yyyy-MM-dd');
      this.keyboard.doneName = '完成';
      this.keyboard.defaultInputName = d.n;
      this.keyboard.show = true;
      this.keyboard.onConfirmCallBackFn = () => {
        let api = this.keyboard.type == 1 ? 'api/income' : 'api/accountBook';
        console.log(
          api,
          this.keyboard.tid,
          this.keyboard.name || this.keyboard.defaultInputName,
          this.keyboard.money,
          this.keyboard.day,
        );
        this.http(api, {
          info: 'insert',
          tid: this.keyboard.tid,
          n: this.keyboard.name || this.keyboard.defaultInputName,
          m: this.keyboard.money * 100,
          d: this.keyboard.day,
        }).then(e => {
          if (e.tip == 1) {
            this.keyboard.show = false;
            this.selectTypePopup.show = false;
            this.activeTabBar = '1';
            this.showAccountBookByMonthFn();
          } else {
            vant.Toast(e.d);
          }
        });
      };
    },
    addPayBudgetFn() {
      this.selectTypePopup.show = true;
      this.selectTypePopup.title = ['预算', ''];
      this.selectTypePopup.next = 'payBudget';

      // 默认为支出的类型列表
      this.selectTypePopupTabsClickToGetList('pay');
    },
    switchType() {
      if (this.pay_budget_type_is_small_or_big == 'big') {
        this.pay_budget_type_is_small_or_big = 'small';
      } else {
        this.pay_budget_type_is_small_or_big = 'big';
      }
    },
    showPayBudgetDate() {
      this.datePicker.type = 'year-month';
      this.datePicker.max = new Date(new Date().setMonth(new Date().getMonth() + 1));
      this.datePicker.min = new Date(2020, 1, 1);
      this.datePicker.value = new Date();
      this.datePicker.show = true;
      this.datePicker.confirm = () => {
        this.datePicker.show = false;
        this.datePicker.type = 'date';
        this.payBudgetMonthList.d = this.datePicker.value.format('yyyy-MM');
        this.showPayBudgetByMonthFn_refresh();
      };
    },
    deletePayBudgetMonthListDetailFn(d) {
      console.log('deletePayBudgetMonthListDetailFn:' + JSON.stringify(d));

      let ids = '';
      if (this.pay_budget_type_is_small_or_big == 'big') {
        let idsArray = [];
        this.payBudgetMonthList.small.forEach(e => {
          if (e.bid == d.bid) {
            idsArray.push(e.id);
          }
        });
        ids = idsArray.join(',');
      } else {
        ids = d.id;
      }
      let postDataJson = {
        info: 'delete',
        ids: ids,
      };
      this.http('api/payBudget', postDataJson).then(e => {
        vant.Toast(e.d);
        this.showPayBudgetByMonthFn_refresh();
      });
    },
    updatePayBudget(d) {
      console.log('updatePayBudget:' + JSON.stringify(d));
      this.prompt.go(d.d + ' ' + d.sn + '的预算/元', v => {
        let postDataJson = {
          info: 'update_detail',
          id: d.id,
          m: v * 100,
          d: d.d,
        };
        this.http('api/payBudget', postDataJson).then(e => {
          this.selectTypePopup.show = false;
          this.payBudgetMonthListSmallDetail.show = false;
          if (e.tip == 1) {
            this.showPayBudgetByMonthFn_refresh();
          }
        });
      });
    },
    toUpdatePayBudget(d) {
      if (this.pay_budget_type_is_small_or_big == 'big') {
        vant.Toast('只能设置小类的预算');
      }
      if (this.pay_budget_type_is_small_or_big == 'small') {
        this.updatePayBudget(d);
      }
    },
    showPayBudgetMonthListDetailFn(d) {
      console.log('showPayBudgetMonthListDetailFn:' + JSON.stringify(d));
      console.log('showPayBudgetMonthListDetailFn:' + this.pay_budget_type_is_small_or_big);
      if (this.pay_budget_type_is_small_or_big == 'big') {
        this.showPayBudgetMonthListSmallDetailFn(d);
      }
      if (this.pay_budget_type_is_small_or_big == 'small') {
        this.showAccountBookDetailByTypeFn(d);
      }
    },
    showPayBudgetMonthListSmallDetailFn(d) {
      let detail = this.payBudgetMonthList.small.filter(e => {
        return e.bid == d.bid;
      });
      this.payBudgetMonthListSmallDetail.config.list = [].concat(detail);
      this.payBudgetMonthListSmallDetail.show = true;
    },

    showAccountBookDetailByTypeFn(d) {
      this.http('api/accountBook', {
        info: 'selectPayDetailBySidAndTime',
        id: d.sid,
        t: 'month',
        d: new Date(d.d).format('yyyy-MM'),
      }).then(e => {
        if (e.tip == 1) {
          this.payBudgetMonthListTypeDetail.config.list = [].concat(e.d.d);
          this.payBudgetMonthListTypeDetail.config.sum = e.d.sum;
          this.payBudgetMonthListTypeDetail.show = true;
        }
      });
    },
    showAccountBookDetailByTimeFn() {
      this.http('api/accountBook', {
        info: 'selectPayDetailByTime',
        t: this.chart.type,
        d: this.chart.time,
      }).then(e => {
        this.refreshing = false;
        if (e.tip == 1) {
          this.chart.detailList = [].concat(e.d.d);

          let smallTypeTemp = [];
          let bigTypeTemp = [];
          let len = this.chart.detailList.length;
          for (let iii = 0; iii < len; iii++) {
            let item = this.chart.detailList[iii];
            let detail = Object.assign({}, item);
            const SMALL_FIND_INDEX = smallTypeTemp.findIndex(findOne => {
              return findOne.tid == detail.tid;
            });
            if (SMALL_FIND_INDEX == -1) {
              detail.n = detail.tn;
              detail.tn = detail.bn;
              smallTypeTemp.push(detail);
            } else {
              let __json = Object.assign({}, smallTypeTemp[SMALL_FIND_INDEX]);
              __json.m = Number(__json.m) + Number(detail.m);
              smallTypeTemp[SMALL_FIND_INDEX] = __json;
            }

            let detail_copy_2 = Object.assign({}, item);
            const BIG_FIND_INDEX = bigTypeTemp.findIndex(findOne => {
              return findOne.tid == detail_copy_2.bid;
            });
            if (BIG_FIND_INDEX == -1) {
              detail_copy_2.n = detail_copy_2.bn;
              detail_copy_2.tn = detail_copy_2.bn;
              detail_copy_2.tid = detail_copy_2.bid;
              bigTypeTemp.push(detail_copy_2);
            } else {
              let __json = Object.assign({}, bigTypeTemp[BIG_FIND_INDEX]);
              __json.m = Number(__json.m) + Number(detail_copy_2.m);
              bigTypeTemp[BIG_FIND_INDEX] = __json;
            }
          }

          smallTypeTemp.sort((a, b) => {
            return b.m - a.m;
          });
          bigTypeTemp.sort((a, b) => {
            return b.m - a.m;
          });
          this.chart.smallTypeConfig.list = [].concat(smallTypeTemp);
          this.chart.smallTypeConfig.sum = e.d.sum;
          this.chart.bigTypeConfig.list = [].concat(bigTypeTemp);
          this.chart.bigTypeConfig.sum = e.d.sum;

          console.log('smallTypeConfig:' + JSON.stringify(this.chart.smallTypeConfig));
          console.log('bigTypeConfig:' + JSON.stringify(this.chart.bigTypeConfig));
        }
      });
    },
    initAccountBookDetailList(newList, ntid) {
      console.log('this.chart.visibleType', this.chart.visibleType);
      let temp = newList.filter(e => {
        if (this.chart.isBig) {
          return e.bid == ntid;
        }
        return e.tid == ntid;
      });
      this.chart.detailConfig.list = [].concat(temp);
      let sum = 0;
      this.chart.detailConfig.list.map(e => {
        sum += Number(e.m);
      });
      this.chart.detailConfig.sum = sum;
      console.log(this.chart.detailConfig.list, this.chart.detailConfig.sum);
      this.myChartInit();
    },
  },
};
