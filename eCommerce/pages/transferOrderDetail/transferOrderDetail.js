
var app = getApp()

Page({
  data: {
    orderInfo: {},
    combinationBenefit: {},
    orderStatus: { '0':'待付款', '6':'已完成', '7':'已关闭'},
    isFromBack: false,
    isFromTemplateMsg: false,
    orderId: '',
    discountList: []
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      franchiseeId: options.franchisee || ''
    })
    this.dataInitial();
  },
  // 每个页面数据初始化函数 dataInitial
  dataInitial: function () {
    this.getOrderDetail(this.data.orderId);
  },
  onShow: function () {
    if(this.data.isFromBack){
      if (!!this.data.orderId) {
        this.getOrderDetail(this.data.orderId, 1);
      }
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  turnToFormDetail: function(){
    let pay_form_data = this.data.orderInfo.pay_form_data;
    app.turnToPage('/userCenter/pages/myMessage/myMessage?from=transforDetail&formid=' + pay_form_data.pay_form_id + '&form=' + pay_form_data.pay_form + '&formDataId=' + pay_form_data.pay_form_data_id);
  },
  getOrderDetail: function (orderId, isFromAddrSelect) {
    let that = this,
      combinationBenefit = {};
    app.getOrderDetail({
      data: {
        order_id: orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        let orderInfo = res.data[0].form_data,
            address_id = '';

        if(orderInfo.selected_combination_benefit){                
          combinationBenefit = orderInfo.selected_combination_benefit;          // 保留两位小数处理 
          combinationBenefit.store_benefit && combinationBenefit.store_benefit.discount_price ? combinationBenefit.store_benefit.discount_price = (+combinationBenefit.store_benefit.discount_price).toFixed(2) : '';
          combinationBenefit.vip_benefit_discount_price ? combinationBenefit.vip_benefit_discount_price = (+combinationBenefit.vip_benefit_discount_price).toFixed(2) : '';
          combinationBenefit.coupon_benefit_discount_price ? combinationBenefit.coupon_benefit_discount_price = (+combinationBenefit.coupon_benefit_discount_price).toFixed(2) : '';
          combinationBenefit.integral_benefit && combinationBenefit.integral_benefit.discount_price ? combinationBenefit.integral_benefit.discount_price = (+combinationBenefit.integral_benefit.discount_price).toFixed(2) : '';
        }
        orderInfo.store_benefit_info && orderInfo.store_benefit_info.discount_price ? orderInfo.store_benefit_info.discount_price = (+orderInfo.store_benefit_info.discount_price).toFixed(2) : '';
        orderInfo.selected_benefit_info && orderInfo.selected_benefit_info.discount_cut_price ? orderInfo.selected_benefit_info.discount_cut_price = (+orderInfo.selected_benefit_info.discount_cut_price).toFixed(2) : '';
        orderInfo.use_balance ? orderInfo.use_balance = (+orderInfo.use_balance).toFixed(2) : '';
        orderInfo.coupon_fee ? orderInfo.coupon_fee = (+orderInfo.coupon_fee) .toFixed(2) : '';
        that.setData({
          orderInfo: orderInfo,
          combinationBenefit: combinationBenefit,
          discountList: orderInfo.can_use_benefit.data,
          index: orderInfo.can_use_benefit.selected_index,
        })
      }
    })
  },
  cancelOrder: function (e) {
    var orderId = this.data.orderId,
        that = this;

    app.showModal({
      content: '是否取消订单？',
      showCancel: true,
      confirmText: '是',
      cancelText: '否',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};

            data['orderInfo.status'] = '7';
            that.setData(data);
          }
        })
      }
    })
  },
  payOrder: function (e) {
    var that = this,
        orderId = this.data.orderId;

    if (this.data.orderInfo.total_price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          that.getOrderDetail(that.data.orderId);
        }
      });
      return;
    }

    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        var param = res.data,
            orderId = that.data.orderId;

        param.orderId = orderId;
        param.goodsType = that.data.orderInfo.goods_type;
        param.success = function () {
          setTimeout(function(){
            that.getOrderDetail(orderId);
          }, 1500);
        };
        app.wxPay(param);
      }
    })
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  changeDiscount: function (e) {
    var _this = this;
    var index = _this.data.orderInfo.can_use_benefit.selected_index;
    var value = parseInt(e.detail.value);

    this.setData({
      index: value
    });

    var discount_type = _this.data.orderInfo.can_use_benefit.data[value].discount_type,
        coupon_id = _this.data.orderInfo.can_use_benefit.data[value].coupon_id;

    app.sendRequest({
      url: '/index.php?r=AppShop/ChangeOrder',
      data: {
        app_id: app.getAppId(),
        order_id: _this.data.orderId,
        discount_type: discount_type,
        coupon_id: coupon_id,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        //console.log(res);
        _this.getOrderDetail(_this.data.orderId);
      }
    });
  },
  verificationCode: function() {
    app.turnToPage('/eCommerce/pages/verificationCodePage/verificationCodePage?detail=' + this.data.orderId + '&sub_shop_app_id=' + this.data.franchiseeId);
  },
  toFixed2: function(num){
    return (+num).toFixed(2);
  }
})
