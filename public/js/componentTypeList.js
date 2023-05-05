Vue.component('component-type-list', {
  props: ['type', 'prompt', 'popup'],
  data() {
    return {
      refreshing: false,
      minclientHeight: clientHeight - 128 + 'px',
      api: '',
      drag: false,
      typeArray: [],
      typeArray_show: [],
      typeArray_hide: [],
      typeArray_show_old: [],
    };
  },
  template: `<div>
              <div :style="'overflow-y: auto;;height:'+minclientHeight">
                <van-cell-group title="使用中">
                  <draggable v-model="typeArray_show" handle=".my-handle" @start="drag=true" @end="dragEndFn">
                    <van-cell center v-for="(d,i) in typeArray_show" :key="i">
                      <template slot="title">
                        <div class="flex content-between ">
                          <div @click="onUpdataNameFn(d)">{{fileType=='smallType'?(d.bn+' - '):''}}{{d.n}}</div>
                          <van-icon name="wap-nav" size="18px" class="custom-icon my-handle" />    
                        </div>
                      </template>
                      <van-icon slot="icon" name="close" size="18px" class="custom-icon" @click="hideById(d)" />    
                    </van-cell>    
                  </draggable>
                </van-cell-group>
                <van-cell-group title="未使用">
                  <van-cell center v-for="(d,i) in typeArray_hide" :key="i">
                    <template slot="title">
                      <div class="flex content-between ">
                        <div  @click="onUpdataNameFn(d)">{{fileType=='smallType'?(d.bn + ' - '):''}}{{d.n}}</div>
                        <van-icon name="delete" size="18px" class="custom-icon" @click="deleteById(d)" />    
                      </div>
                    </template>
                    <van-icon slot="icon" name="add-o" size="18px" class="custom-icon" @click="showById(d)" />
                  </van-cell>
                </van-cell-group>
              </div>
              <div class="fixed-bottom flex-group">
                <van-button icon="replay" block size="small" type="info" @click="init">
                  刷新
                </van-button>
                <van-button icon="plus" block plain size="small" type="info"
                  @click="add">
                  新增
                </van-button>
              </div>
            </div>`,
  watch: {
    typeArray(n) {
      this.typeArray_show = n.filter((e) => e.s == 1);
      this.typeArray_hide = n.filter((e) => e.s == 0);
    },
    typeArray_show(n, o) {
      this.typeArray_show_old = o;
    },
  },
  computed: {
    fileType() {
      return this.type.split('_')[0];
    },
    accountType() {
      return this.type.split('_')[1];
    },
  },
  created() {
    this.api = 'api/' + this.fileType + '';
    // this.init();
  },
  methods: {
    onUpdataNameFn(d) {
      this.prompt.go(d.n, (v) => {
        let postDataJson = {
          info: 'update_name',
          id: d.id,
          n: v,
        };
        this.http(this.api, postDataJson).then((e) => {
          if (e.tip == 1) {
            this.init();
          }
        });
      });
    },
    add() {
      if (this.fileType == 'bigType') {
        this.addByPromptFn();
      } else {
        this.addByPopupFn();
      }
    },
    addByPopupFn() {
      this.http('api/bigType', {
        info: 'select_' + this.accountType,
      }).then((e) => {
        if (e.tip == 1) {
          this.popup.value = '';
          this.popup.selectIndex = -1;
          this.popup.list = [];
          this.popup.onConfirmCallBackFn = (id, v) => {
            this.addTypeFn(id, v);
            this.popup.show = false;
          };
          this.popup.show = true;
          this.$nextTick(() => {
            this.popup.list = e.d;
          });
        }
      });
    },
    addByPromptFn() {
      this.prompt.go('请输入新的类别', (v) => {
        let t = this.accountType == 'income' ? 1 : 2;
        this.addTypeFn(t, v);
      });
    },
    addTypeFn(type, n) {
      this.http(this.api, {
        info: 'insert',
        m: type, //bid 或 btype
        n: n, // name
      }).then((e) => {
        if (e.tip == 1) {
          this.init();
        }
      });
    },

    getList() {
      return this.typeArray;
    },
    http(url, data) {
      return http(url, data, this.toLoading);
    },
    toLoading(n) {
      this.$emit('toLoading', n);
    },
    dragEndFn() {
      this.drag = false;
      this.reSort(this.typeArray_show, this.typeArray_show_old);
    },
    init() {
      let postDataJson = {
        info: 'select_all_' + this.accountType,
      };
      this.http(this.api, {
        info: 'select_all_' + this.accountType,
      }).then((e) => {
        // 下拉刷新状态结束
        this.refreshing = false;
        if (e.tip == 1) {
          this.typeArray = e.d;
        }
      });
    },
    deleteById(d) {
      var id = d.id;

      vant.Dialog.confirm({
        title: '彻底 删除  ' + d.n + '？',
        message: '无法恢复',
      })
        .then(() => {
          // on confirm
          this.http(this.api, {
            info: 'delete',
            id: id,
          }).then((e) => {
            this.init();
          });
        })
        .catch(() => {
          // on cancel
        });
    },
    hideById(d) {
      var id = d.id;

      vant.Dialog.confirm({
        title: '移除 ' + d.n + '？',
        message: '',
      })
        .then(() => {
          // on confirm
          this.http(this.api, {
            info: 'hide',
            id: id,
          }).then((e) => {
            this.init();
          });
        })
        .catch(() => {
          // on cancel
        });
    },
    showById(d) {
      var id = d.id;
      vant.Dialog.confirm({
        title: '添加 ' + d.n + '？',
        message: '',
      })
        .then(() => {
          // on confirm
          this.http(this.api, {
            info: 'show',
            id: id,
          }).then((e) => {
            this.init();
          });
        })
        .catch(() => {
          // on cancel
        });
    },
    reSort(newArray, oldArray) {
      var MY_JSON = {};
      newArray.forEach((item, index) => {
        MY_JSON[item.id] = oldArray[index].i;
      });
      var d = {
        info: 'px',
        list: JSON.stringify(MY_JSON),
      };
      this.http(this.api, d).then((e) => {
        this.init();
      });
    },
  },
});
