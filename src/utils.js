import axios from 'axios';
import Qs from 'qs';
import { showToast } from 'vant';

/**
 * 后端 API 根地址。
 * - 默认 '/' ：同源部署（Worker/静态托管同域反代）。
 * - 若需切换为 Cloudflare Worker 域名，可设置环境变量 VITE_API_BASE，
 *   或直接将此常量改为 "https://xxx.workers.dev/"。
 */
export const DEFAULT_API = import.meta.env.VITE_API_BASE || '/';

/**
 * POST 表单请求（兼容原后端 /api/<module> 约定，form-urlencoded）
 * @param {string} url      e.g. 'api/accountBook'
 * @param {object} postData e.g. { info: 'select_by_month', month: '2024-01' }
 * @param {function} toLoading  可选的 loading 计数回调
 */
export function request(url, postData, toLoading) {
  const beforeReq = typeof toLoading === 'function' ? toLoading : () => {};
  return axios({
    url: DEFAULT_API + url,
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    transformRequest: [
      function (data) {
        beforeReq(true);
        return Qs.stringify(data);
      },
    ],
    transformResponse: [
      function (data) {
        beforeReq(false);
        return JSON.parse(data);
      },
    ],
    data: postData,
  })
    .then(res => res.data)
    .catch(err => {
      beforeReq(false);
      console.error('request error:', err);
      showToast('网络异常，请稍后重试');
      return { tip: 0, d: [], msg: '网络异常' };
    });
}

export const DEFAULT_SEARCH = function () {
  return {
    st: null,
    et: null,
    n: null,
    bn: null,
    sn: null,
  };
};

export default { name: 'utils' };