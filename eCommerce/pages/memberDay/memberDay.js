
var app = getApp();

const lunar = require("../../../utils/lunar.js");
// import lunar from "../../utils/lunar.js"
const minYear = 1900;
const maxYear = 2099;

Page({
  data: {
    year: new Date().getFullYear(),     // 年份
    month: new Date().getMonth() + 1,   // 月份1~12
    day: new Date().getDate(),          // 日期
    startDate: '2018-01',               // 日历范围起点
    endDate: '2099-12',                 // 日历范围终点
    header: true,                       // 是否显示标题
    next: true,                         // 是否显示下个月按钮
    prev: true,                         // 是否显示上个月按钮
    showMoreDays: true,                 // 显示额外上下月份日期
    weeks: true,                        // 是否显示周标题
    weeksType: 'cn',                    // 周标题类型
    cellSize: 32,                       // 单元格大小
    lunar: false,                       // 是否显示农历

    days_array: [],                     // 日期数组
    memberDays: [],
    weekTitle: ['日', '一', '二', '三', '四', '五', '六'],
    max_year: 2099,                     // 最大年份
    max_month: 12,                      // 最大月份
    min_year: 1900,                     // 最小年份
    min_month: 1,                       // 最小月份      
    franchiseeId: ''                    //子店id
  },
  onLoad: function (options) {
    let franchiseeId = options.franchisee || '';
    this.setData({
      franchiseeId: franchiseeId
    });

    this._yearChange(this.data.year);
    this._monthChange(this.data.month);
    this._dayChange(this.data.day);
    this._setStartDate(this.data.startDate);
    this._setEndDate(this.data.endDate);
    this._headerChange(this.data.header);
    this._moreChange(this.data.showMoreDays);
    this._showWeeksChange(this.data.weeks);
    this._weeksTypeChange(this.data.weeksType);
    this._setCellSize(this.data.cellSize);
    this._showLunar(this.data.weeksType);

    this.getMemberDayInfo();
  },

  // 获取会员日详情
  getMemberDayInfo: function () {
    const daysArray = this.data.days_array;
    const len = daysArray.length;
    const startInfo = daysArray[0][0];
    const endInfo = daysArray[len - 1][6];
    const _this = this;

    app.sendRequest({
      url: '/index.php?r=appVipCard/vipBenefitDayCalendar',
      method: 'post',
      data: {
        start_time: startInfo.year + '-' + startInfo.month + '-' + startInfo.day,
        end_time: endInfo.year + '-' + endInfo.month + '-' + endInfo.day,
        sub_shop_app_id: _this.data.franchiseeId
      },
      hideLoading: false,
      success: function (res) {
        let data = res.data;
        let memberDays = [];

        for(let key of Object.keys(data)){
          if(data[key].length && key.split('-').length === 3){
            let ids = [];

            data[key].map((item) => {
              ids.push(item.id);
            })
            memberDays.push({
              id: ids,
              year: key.split('-')[0],
              month: key.split('-')[1],
              day: key.split('-')[2]
            })
          }
        }
        _this.setData({
          memberDays: memberDays
        })
        _this._setMemberDay();
      }
    })
  },

  _setMemberDay: function () {
    this.setData({
      days_array: this._setCalendarData(this.data.year, this.data.month)
    });
  },

  // 日历的方法列表
  // 检查年份
  _checkYear: function (year) {
    if (year < minYear) {
      throw new RangeError('年份不能小于' + minYear + '年');
    } else if (year > maxYear) {
      throw new RangeError('年份不能大于' + maxYear + '年');
    }
    return true;
  },

  // 检查月份
  _checkMonth: function (month) {
    if (month < 1) {
      throw new RangeError('月份不能小于1');
    } else if (month > 12) {
      throw new RangeError('月份不能大于12');
    }
    return true;
  },

  /**
   * 检查日期是否输入正确
   * @param day int 日期
   */
  _checkDay: function (day) {
    if (day < 1) {
      throw new RangeError('日期不能小于1');
    } else if (day > 31) {
      throw new RangeError('日期不能大于31');
    }
    return true;
  },

  // 年份属性改变
  _yearChange: function (newYear, oldYear) {
    if (this._checkYear(newYear)) {
      this.setData({
        year: newYear,
        days_array: this._setCalendarData(newYear, this.data.month)
      });
    }
  },

  // 月份属性改变
  _monthChange: function (newMonth, oldMonth) {
    if (this._checkMonth(newMonth)) {
      this.setData({
        month: newMonth,
        days_array: this._setCalendarData(this.data.year, newMonth)
      });
    }
  },

  // 日期属性改变
  _dayChange: function (newDay, oldDay) {
    if (this._checkDay(newDay)) {
      this.setData({
        day: newDay
      });
    }
  },

  // 设置起始日期
  _setStartDate: function (newDate, oldDate) {
    if (newDate.length == 7 && newDate.indexOf('-') == 4) {
      const year = parseInt(newDate.split('-')[0]);
      const month = parseInt(newDate.split('-')[1]);
      if (!isNaN(year) && year >= minYear && !isNaN(month) && month >= 1 && month <= 12) {
        this.setData({
          startDate: newDate,
          min_year: year,
          min_month: month
        });
      } else {
        throw new Error('起始日期必须是YYYY-MM格式，且大于等于1900-01');
      }
    } else {
      throw new Error('起始日期必须是YYYY-MM格式');
    }
  },

  // 设置结束日期
  _setEndDate: function (newDate, oldDate) {
    if (newDate.length == 7 && newDate.indexOf('-') == 4) {
      const year = parseInt(newDate.split('-')[0]);
      const month = parseInt(newDate.split('-')[1]);
      if (!isNaN(year) && year <= 2099 && !isNaN(month) && month >= 1 && month <= 12) {
        this.setData({
          endDate: newDate,
          max_year: year,
          max_month: month
        });
      } else {
        throw new Error('结束日期必须是YYYY-MM格式，且小于等于2099-12');
      }
    } else {
      throw new Error('结束日期必须是YYYY-MM格式');
    }
  },

  // 是否显示标题
  _headerChange: function (newHeader, oldHeader) {
    this.setData({
      header: !!newHeader
    });
  },

  // 是否显示额外的月份日期
  _moreChange: function (newMore, oldMore) {
    this.setData({
      showMoreDays: !!newMore,
      days_array: this._setCalendarData(this.data.year, this.data.month)
    });
  },

  // 周标题类型
  _weeksTypeChange: function (newVal, oldVal) {
    switch (newVal) {
      case 'en':
        this.setData({
          weeksType: 'en',
          weekTitle: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        });
        break;
      case 'cn':
        this.setData({
          weeksType: 'cn',
          weekTitle: ['日', '一', '二', '三', '四', '五', '六']
        });
        break;
      case 'full-en':
        this.setData({
          weeksType: 'full-en',
          weekTitle: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        });
        break;
      default:
        this.setData({
          weeksType: 'en',
          weekTitle: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        });
        break;
    }
  },

  // 是否显示周标题
  _showWeeksChange: function (newVal, oldVal) {
    this.setData({
      weeks: !!newVal,
    });
  },

  // 设置单元格宽度
  _setCellSize: function (newSize, oldSize) {
    this.setData({
      cellSize: newSize
    });
  },

  // 是否显示农历
  _showLunar: function (newConfig, oldConfig) {
    this.setData({
      lunar: !!newConfig
    });
  },

  /**
   * 设置日历
   * @param int year 年份
   * @param int month 月份，取值1~12
   */
  _setCalendarData: function (year, month) {
    const empty_days_count = new Date(year, month - 1, 1).getDay(); // 本月第一天是周几，0是星期日，6是星期六
    let empty_days = new Array;
    const prev_month = month - 1 == 0 ? 12 : month - 1;             // 上个月的月份数
    const prev_year = month - 1 == 0 ? this.data.year - 1 : this.data.year;
    const today = new Date();

    // 上个月的日期   
    for (let i = 0; i < empty_days_count; i++) {
      empty_days.push({
        state: 'inactive',
        day: -1,
        month: prev_month,
        year: prev_year,
        info: 'prev',
        color: '#c3c6d1',
        background: 'transparent'
      });
    }

    // 下个月的日期 
    const last_day = new Date(year, month, 0);          // 本月最后一天
    const days_count = last_day.getDate();              // 本月最后一天是几号
    const last_date = last_day.getDay();                // 本月最后一天是星期几
    const next_month = month + 1 == 13 ? 1 : month + 1; // 下个月的月份数
    const next_year = month + 1 == 13 ? this.data.year + 1 : this.data.year;
    let empty_days_last = new Array;
    for (let i = 0; i < 6 - last_date; i++) {
      empty_days_last.push({
        state: 'inactive',
        day: -2,
        month: next_month,
        year: next_year,
        info: 'next',
        color: '#c3c6d1',
        background: 'transparent'
      });
    }

    // 本月的日期
    let temp = new Array;
    for (let i = 1; i <= days_count; i++) {
      temp.push({
        state: 'inactive',
        day: i,
        month: month,
        year: year,
        info: 'current',
        color: '#4a4f74',
        background: 'transparent'
      });
    }
    const days_range = temp;                                   // 本月
    let days = empty_days.concat(days_range, empty_days_last); // 上个月 + 本月 + 下个月
    
    // 设置会员日 + 今天的日期
    for (let i = 0; i < this.data.memberDays.length; i++) {
      const item = this.data.memberDays[i];
      for (let j = 0; j < days.length; j++) {
        if (days[j].year == item.year && days[j].month == item.month && days[j].day == item.day) {
          days[j].is_member_day = 1;
        }
        if(days[j].year == today.getFullYear() && days[j].month === today.getMonth() + 1 && days[j].day === today.getDate()){
          days[j].is_today = 1;
        }
      }
    }



    // 如果要显示前后月份的日期
    if (this.data.showMoreDays) {
      // 显示下月的日期
      let index = days.findIndex(element => { return element.day == -2; });
      if (index != -1) {
        const length = days.length;
        const count = length - index;
        for (let i = 1; i <= count; i++) {
          days[index + i - 1].day = i;
        }
      }

      // 显示上月的日期
      index = days.findIndex(element => { return element.day == 1; }) - 1;
      if (index != -1) {
        const last_month_day = new Date(year, month - 1, 0).getDate();
        for (let i = 0; i <= index; i++) {
          days[i].day = last_month_day - index + i;
        }
      }
    }

    // 设置农历  
    for (let i = 0; i < days.length; i++) {
      const item = days[i];
      const solarDay = item.day;
      const solarMonth = item.month;
      const solarYear = year;
      if (solarDay > 0) {
        const lunarDate = lunar.solarToLunar(year, solarMonth, solarDay);
        days[i]['lunarMonth'] = lunarDate.monthStr;
        days[i]['lunarDay'] = lunarDate.dayStr;
        if (lunarDate.dayStr == '初一') {
          days[i]['lunarDay'] = lunarDate.monthStr;
        }
      }
    }

    let days_array = new Array;
    let week = new Array;
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (i % 7 == 6) {
        days_array.push(week);
        week = new Array;
      }
    }

    if (week.length > 0) {
      days_array.push(week);
    }
    return days_array;
  },

  // 点击下个月
  nextMonth: function () {
    const eventDetail = {
      prevYear: this.data.year,
      prevMonth: this.data.month
    };

    if (this.data.month == 12) {
      this.setData({
        year: this.data.year + 1,
        month: 1
      });
    } else {
      this.setData({
        month: this.data.month + 1
      });
    }
    this.setData({
      days_array: this._setCalendarData(this.data.year, this.data.month)
    });
    eventDetail['currentYear'] = this.data.year;
    eventDetail['currentMonth'] = this.data.month;
    // this.triggerEvent('nextMonth', eventDetail);
    this.getMemberDayInfo();
  },

  // 点击上个月
  prevMonth: function () {
    const eventDetail = {
      prevYear: this.data.year,
      prevMonth: this.data.month
    };

    if (this.data.month == 1) {
      this.setData({
        year: this.data.year - 1,
        month: 12
      });
    } else {
      this.setData({
        month: this.data.month - 1
      })
    }
    this.setData({
      days_array: this._setCalendarData(this.data.year, this.data.month)
    });
    eventDetail['currentYear'] = this.data.year;
    eventDetail['currentMonth'] = this.data.month;
    // this.triggerEvent('prevMonth', eventDetail);
    this.getMemberDayInfo();
  },

  // 日期选择器变化
  dateChange: function (event) {
    const eventDetail = {
      prevYear: this.data.year,
      prevMonth: this.data.month
    };
    const value = event.detail.value;
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    this.setData({
      year: year,
      month: month,
      days_array: this._setCalendarData(year, month)
    });

    eventDetail['currentYear'] = year;
    eventDetail['currentMonth'] = month;
    // this.triggerEvent('dateChange', eventDetail);
  },

  // 点击具体日期
  dayClick: function (event) {
    const click_day = event.currentTarget.dataset.day;
    const detail = {
      year: click_day.year,
      month: click_day.month,
      day: click_day.day,
      color: click_day.color,
      lunarMonth: click_day.lunarMonth,
      lunarDay: click_day.lunarDay,
      background: click_day.background
    };
    console.log(detail);
    this.data.memberDays.map((item) => {
      if(item.year == detail.year && item.month == detail.month && item.day == detail.day){
        let pagePath = '';

        if(item.id.length > 1){
          pagePath = '/eCommerce/pages/memberDayList/memberDayList?date=' + detail.year + '-' + detail.month + '-' + detail.day;
        }else {
          pagePath = '/eCommerce/pages/memberDayDetail/memberDayDetail?id=' + item.id[0];          
        }
        app.turnToPage(pagePath, false);
      }
    })
  },
  attached: function () {
    const year = this.data.year;
    const month = this.data.month;
    this.setData({
      days_array: this._setCalendarData(year, month)
    });
  },
  externalClasses: [
    'calendar-style',     // 日历整体样式
    'header-style',       // 标题样式
    'board-style',        // 面板样式        
  ]
})
