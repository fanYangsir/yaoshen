
var app = getApp()

Page({
  data: {
    artivityList: [],
    franchisee: ''
  },
  onLoad: function (options) {
    let franchisee = options.franchisee || '';

    this.setData({
      franchisee: franchisee
    });
    this.getStoreBenefitActivityList();
  },
  // 获取店铺优惠活动列表
  getStoreBenefitActivityList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppStoreBenefit/GetStoreBenefitActivityList',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchisee
      },
      success: function (res) {
        let data = [];
        res.data.map((val) => {
          val.activity_start_date = val.activity_start_date.substr(0, 16);
          val.activity_end_date = val.activity_end_date.substr(0, 16);
          if (val.activity_rules && val.activity_rules.length > 0) {
            let popRule = val.activity_rules[val.activity_rules.length - 1];

            if (popRule.discount_limit == -1) {
              val.max_discount_price = popRule.discount_price;
            } else {
              val.max_discount_price = (popRule.discount_price * popRule.discount_limit) % 1 === 0 ? popRule.discount_price * popRule.discount_limit :  (popRule.discount_price * popRule.discount_limit).toFixed(2);
            }
          }

          if(val.activity_end_date.indexOf('9999') !== -1){
            val.activity_end_date = '长期'
          }

          if (val.expired != 1) {
            data.push(val);
          }
        })
        data.sort(function (x, y) {
          if (x.expired != 0) {
            return 1
          } else {
            return 0
          }
        })
        _this.setData({
          artivityList: data
        })
      }
    })
  }
})
