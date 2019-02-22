
var app = getApp();

Page({
  data: {
    memberDayInfo: {},               // 会员日信息
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
    let id = options.id ? options.id : '';
    let franchiseeId = options.franchisee || '';

    this.setData({
      franchiseeId: franchiseeId
    })

    this.getMemberDetail(id);
  },
  getMemberDetail: function (id) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getVipBenefitDay',
      method: 'post',
      data: {
        data_id: id,
        sub_shop_app_id: _this.data.franchiseeId
      },
      hideLoading: true,
      success: function (res) {
        let data = res.data;

        if(data.date_type === '0'){
          if (data.start_date === data.end_date) {
            data.date = data.start_date;
          } else {
            data.date = data.start_date + ' 至 ' + data.end_date;
          }
        }else if (data.date_type === '1') {
          let len = data.date_arr.length;

          data.date = '';
          data.date_arr.forEach((date, ind) => {
            ind === len - 1 ? data.date += _this.data.weekData[date - 1]['label'] : data.date += _this.data.weekData[date - 1]['label'] + '、';
          });
        } else if (data.date_type === '2') {
          let len = data.date_arr.length;

          data.date = '每月';
          data.date_arr.forEach((date, ind) => {
            ind === len - 1 ? data.date += date + '号' : data.date += date + '号、';
          });
        }
        data.benefits = [];
        if(data.discount && data.discount != 0){
          data.benefits.push({
            category: 'discount',
            discount: data.discount
          });
        }
        if(data.user_coupon_list && Array.isArray(data.user_coupon_list) && data.user_coupon_list.length){
          data.user_coupon_list.map((coupon) => {
            coupon.category = 'coupon';
            coupon.name = coupon.type === '0' ? '满减券' :
                          coupon.type === '1' ? '打折券' : 
                          coupon.type === '2' ? '代金券' : 
                          coupon.type === '3' ? '兑换券' : 
                          coupon.type === '4' ? '储值券' : 
                          coupon.type === '5' ? '通用券' : ''
            data.benefits.push(coupon);
          })
        }
        // data.start_time = data.start_time.split(':')[0]

        _this.setData({
          memberDayInfo: res.data
        })

        console.log(_this.data.memberDayInfo);
      }
    })
  }
})
