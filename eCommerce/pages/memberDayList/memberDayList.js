
var app = getApp();

Page({
  data: { 
    listData: [],                   // 会员日列表数据
    screenHeight: 1624,             // 屏幕高度
    weekData: [                    
      { label: '周一', value: 1 },
      { label: '周二', value: 2 },
      { label: '周三', value: 3 },
      { label: '周四', value: 4 },
      { label: '周五', value: 5 },
      { label: '周六', value: 6 },
      { label: '周日', value: 7 }
    ],
    franchiseeId: ''
  },
  onLoad: function (options) {
    let date = options.date ? options.date : '';
    let franchiseeId = options.franchisee || '';

    this.setData({
      franchiseeId: franchiseeId
    })

    this.getSystemInfo();
    this.getMemberDayList(date);
  },
  // 获取屏幕高度
  getSystemInfo: function(){
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          screenHeight: res.screenHeight * 2
        })
      }
    }); 
  },
  // 获取会员日详情
  getMemberDayList: function (date) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appVipCard/vipBenefitDayCalendar',
      method: 'post',
      data: {
        start_time: date,
        end_time: date,
        sub_shop_app_id: _this.data.franchiseeId
      },
      hideLoading: true,
      success: function (res) {
        let data = [];
        for(let key of Object.keys(res.data)){
          data = res.data[key];
        }
        data.map((item) => {
          if(item.date_type === '0'){
            if (item.start_date === item.end_date) {
              item.date = item.start_date;
            } else {
              item.date = item.start_date + ' 至 ' + item.end_date;
            }
          }else if (item.date_type === '1') {
            let len = item.date_arr.length;

            item.date = '';
            item.date_arr.forEach((date, ind) => {
              ind === len - 1 ? item.date += _this.data.weekData[date - 1]['label'] : item.date += _this.data.weekData[date - 1]['label'] + '、';
            });
          } else if (item.date_type === '2') {
            let len = item.date_arr.length;
            
            item.date = '每月';
            item.date_arr.forEach((date, ind) => {
              ind === len - 1 ? item.date += date + '号' : item.date += date + '号、';
            });
          }
        })

        _this.setData({
          listData: data
        })
      }
    })
    // const daysArray = this.data.days_array;
    // const len = daysArray.length;
    // const startInfo = daysArray[0][0];
    // const endInfo = daysArray[len - 1][6];
    // const _this = this;

    // app.sendRequest({
    //   url: '/index.php?r=appVipCard/vipBenefitDayCalendar',
    //   method: 'post',
    //   data: {
    //     start_time: startInfo.year + '-' + startInfo.month + '-' + startInfo.day,
    //     end_time: endInfo.year + '-' + endInfo.month + '-' + endInfo.day
    //   },
    //   hideLoading: true,
    //   success: function (res) {
    //   }
    // })
  },
  // 跳转到详情页
  gotoDetail(e){
    let id = e.currentTarget.dataset.id;
    let pagePath = '/eCommerce/pages/memberDayDetail/memberDayDetail?id=' + id;

    app.turnToPage(pagePath, false);
  }
})  