import { createApp } from 'vue';
import Vant from 'vant';
import 'vant/lib/index.css';

import { installDateFormat } from '@/utils/date';
import '@/styles/index.css'; // global css

import App from './App.vue';

installDateFormat();

const app = createApp(App);
app.use(Vant);
app.mount('#app');
export default app;
