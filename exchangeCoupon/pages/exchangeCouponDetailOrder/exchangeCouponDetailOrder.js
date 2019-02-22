var app = getApp()

Page({

  data: {
    useBalance: true,
    balance: '',
    couponId: '',
    couponDetail: '',
    payInfo: '',
    discountList: [],
    isFromSelectAddress: false,
    franchisee_id: '',
    cart_id_arr: [],
    cart_data_arr: [],
    balance: '',
    requesting: false,
    additional_info: {},
    is_group:'',
    inputTimer: '',
    style: '', // 兑换券样式存储
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
  },
  hasRequiredSuppInfo: false,
  onLoad: function (options) {
    let that = this;
    let id = options.id 
    let exchangeCouponDetail = app.globalData.exchangeCouponStyle
    let style = {}
    if (exchangeCouponDetail) {
      let styleArr = this.cutStyle(exchangeCouponDetail.style)
      style.strStyle = styleArr
      style.lineBackgroundColor = exchangeCouponDetail.customFeature.lineBackgroundColor
      style.secColor = exchangeCouponDetail.customFeature.secColor
    }
    that.setData({
      'couponId': id,
      'style': style
    });
    this.getExchangeCouponInfo()
    this.getPayInfo()
  },
  cutStyle: function (str) { // 截取style样式
    let obj = str.split(';').reduce((p, e) => {
      let [k,v] = e.split(':')
      v = v && v.trim() || ''
      if (v) {
        p[k] = v
      }
      return p
    }, {})
    return obj
  },
  getExchangeCouponInfo: function () { // 兑换券详情
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        'app_id': app.globalData.appId,
        'coupon_id': that.data.couponId
      },
      hideLoading: true,
      success: function(res){
        that.setCouponData(res.data);
      }
    });
  },
  setCouponData: function (data) { // 处理兑换券的使用方式
    let that = this;
    let useCondition = '';
    if (data.type == 0) {
      useCondition = '满' + data.condition + '，减' + data.value + '元';
    } else if (data.type == 1) {
      useCondition = '打' + data.value + '折';
    } else if (data.type == 2) {
      useCondition = '可抵扣' + data.value + '元';
    } else if (data.type == 3) {
      if (data.extra_condition == '') {
        useCondition = '直接兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.price) {
        useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.goods_id) {
        useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
      }
    } else if (data.type == 4) {
      useCondition = '储值金可充值' + data.value + '元';
    } else if (data.type == 5) {
      useCondition = data.extra_condition;
    }
    let newData = data;
    newData['useCondition'] = useCondition;
    that.setData({
      'couponDetail': newData
    });
  },
  useBalanceChange: function(e){ // 是否使用储值金
    this.setData({
      useBalance: e.detail.value ? true : false
    });
    this.changePayInfo();
  },
  changePayInfo: function () { // 改变支付优惠
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/calculateCouponPrice',
      data: {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit': that.data.selectDiscountInfo.no_use_benefit ? 'no_use_benefit' : '',
        'no_use_balance': that.data.useBalance ? 0 : 1,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title
      },
      hideLoading: true,
      method: 'post',
      success: function(res){
        let newData = res.data
        that.setData({
          'payInfo': newData,
          'balance': newData.balance
        });
        // that.setCouponData(res.data);
      }
    });

  },
  getPayInfo: function(){ // 第一次拿取支付信息
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/calculateCouponPrice',
      data: {
        'app_id': app.globalData.appId,
        'id': that.data.couponId
      },
      hideLoading: true,
      method: 'post',
      success: function(res){
        let newData = res.data
        let  info = res.data;
        let  benefits = info.benefit;
        let goodsBenefitsData = [];
        let selectDiscountInfo = {};
        if (info.selected_benefit) {
          selectDiscountInfo = {
            discount_title: info.selected_benefit.discount_title,
            discount_type: info.selected_benefit.discount_type,
            coupon_id: info.selected_benefit.coupon_id,
            vip_id: info.selected_benefit.vip_id
          }    
        }
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
        that.setData({
          'balance': newData.balance,
          'payInfo': newData,
          'discountList': goodsBenefitsData,
          'selectDiscountInfo': selectDiscountInfo
        });
        // that.setCouponData(res.data);
      },
      complete: function (res) {
        if (res.status === 0) {
          return
        }
        app.showModal({content: res.data});
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);    
      }
    });
  },
  confirmPayment: function(e){
    var list = this.data.goodsList,
        that = this,
        no_use_balance = that.data.useBalance  ? 0 : 1, 
        selected_benefit = this.data.selectDiscountInfo.discount_type ? '': 'no_use_benefit';
        // hasWritedAdditionalInfo = false;
    if(this.requesting){
      return;
    }
    let data
    this.requesting = true;
    if (selected_benefit == '') {
      data = {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title,
        'no_use_balance': no_use_balance
      }
    } else {
      data = {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit': selected_benefit,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title,
        'no_use_balance': no_use_balance
      }
    }
    app.sendRequest({
      url : '/index.php?r=appCoupon/addCouponOrder',
      method: 'post',
      data: data,
      success: function(res){
        that.payOrder(res.data);
      },
      fail: function(){
        that.requesting = false;
      },
      successStatusAbnormal: function(){
        that.requesting = false;
      }
    });
  },
  payOrder: function(orderId){
    var that = this;

    function paySuccess() {
      app.showModal({content: '兑换成功！'});
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }

    function payFail(){
      app.showModal({content: '兑换失败！'});
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }

    if( orderId.total_price == 0){
      app.showModal({content: '兑换成功！'});
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId.order_id
      },
      success: function (res) {
        var param = res.data;

        param.orderId = orderId.order_id;
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        that.wxPay(param);
      },
      fail: function(){
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  wxPay: function(param){
    var that = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      success: function(res){
        app.wxPaySuccess(param);
        param.success();
      },
      fail: function(res){
        if(res.errMsg === 'requestPayment:fail cancel'){
          app.showModal({
            content: '支付已取消'
          })
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
          return;
        }
        app.showModal({
          content: '支付失败'
        })
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
        app.wxPayFail(param, res.errMsg);
      }
    })
  },
  // exchangeCouponHideDialog: function(){
  //   this.setData({
  //     selectDiscountInfo: {
  //       title: "不使用优惠",
  //       name: '无',
  //       no_use_benefit: 1
  //     },
  //     'exchangeCouponData.dialogHidden': true,
  //     'exchangeCouponData.hasSelectGoods': false,
  //     'exchangeCouponData.voucher_coupon_goods_info': {}
  //   })
  //   this.getPayInfo();
  // },
  showMemberDiscount: function(){
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function(event){
    this.setData({
      'selectDiscountInfo': event.detail.selectedDiscount
    })
    this.changePayInfo();
  },
})
