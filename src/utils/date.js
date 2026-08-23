/**
 * 日期格式化工具
 * 兼容原有 `Date.prototype.format` 逻辑（原定义于 public/index.html）。
 * 支持格式：yyyy / MM / dd / hh / mm / ss / q(季) / S(毫秒) / W(星期汉字) / w(一年内的第几周)
 */
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function formatDate(date, fmt) {
  const d = new Date(date);

  const firstOfYear = new Date(d);
  firstOfYear.setMonth(0);
  firstOfYear.setDate(1);
  let weekOfYear = Math.round((d.valueOf() - firstOfYear.valueOf()) / 86400000);
  weekOfYear = Math.ceil((weekOfYear + firstOfYear.getDay()) / 7);
  weekOfYear = firstOfYear.getDay() == 1 ? weekOfYear : weekOfYear - 1;

  const o = {
    'M+': d.getMonth() + 1,
    'd+': d.getDate(),
    'h+': d.getHours(),
    'm+': d.getMinutes(),
    's+': d.getSeconds(),
    'q+': Math.floor((d.getMonth() + 3) / 3),
    S: d.getMilliseconds(),
    W: WEEK_DAYS[d.getDay()],
    'w+': weekOfYear,
  };

  let result = fmt;
  if (/(y+)/.test(result)) {
    result = result.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(result)) {
      result = result.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length),
      );
    }
  }
  return result;
}

/** 挂载到 Date.prototype，保留旧模板/方法中的 `new Date(...).format('yyyy-MM')` 用法 */
export function installDateFormat() {
  if (typeof Date.prototype.format !== 'function') {
    Date.prototype.format = function (fmt) {
      return formatDate(this, fmt);
    };
  }
}

// 模块加载即挂载：ES 模块按依赖图先执行本模块体，
// 保证早于 store 等消费方的顶层初始化（旧代码是 index.html 内联脚本在应用前执行）
installDateFormat();

export default { install: installDateFormat };