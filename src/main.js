import Vue from 'vue';
import App from './App.vue';
import Vant from 'vant';
import 'vant/lib/index.css';

import '@/styles/index.css'; // global css

Vue.config.productionTip = false;

Vue.use(Vant);
new Vue({
  render: h => h(App),
}).$mount('#app');
