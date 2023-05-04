// 1收2支
    var clientHeight = document.documentElement.clientHeight
    var clientWidth = document.documentElement.clientWidth;
    var chartEle =document.getElementById('myChart');
    if(chartEle){
        chartEle.style.width = clientWidth + 'px';
        // chartEle.style.height = clientWidth*0.5 + 'px';
    }

    Date.prototype.format = function (fmt) {
 var dayArr = ['日', '一', '二', '三', '四', '五', '六'];

  
        var date2 = new Date(this);
            date2.setMonth(0);
            date2.setDate(1);
          var  yearWeek = Math.round((this.valueOf() - date2.valueOf()) / 86400000);
            yearWeek = Math.ceil((yearWeek + ((date2.getDay() + 1) - 1)) / 7);
            yearWeek=date2.getDay()==1?yearWeek:yearWeek-1
           
      var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds(), //毫秒
        "W": dayArr[this.getDay()], //周几 汉字
        "w+": yearWeek //今年第几周 数字
      };
      if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
      }
      for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
      }
      return fmt;
    }