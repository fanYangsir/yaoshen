const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    couponId: '',
    toastInfo: {
      isShow: false,
      tipTxt: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取优惠券id
    let cId = options && options.cId, // 优惠券id
      type = options && options.type, // 样式的类型
      mId = options && options.mId,   // 商家id
      uId = options && options.uId || '',
      status = options && options.status || ''; // 优惠券状态
    this.setData({
      styleType: type,
      couponId: cId,
      merchantId: mId,
      userCouponId: uId,
      couponStatus: status
    });
    // 生成二维码
    if (+type === 1) {
      this.getMerchantQRCode();
    }
    this.getCouponDetail();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '【微分商城】海量商家优惠券等你去领！',
      path: '/differentialMall/pages/dMWebView/dMWebView'
    }
  },
  /**
   * 获取优惠券信息
   */
  getCouponDetail: function () {
    let that = this;
    let dataObj = this.data;
    let cId = dataObj.couponId, // 优惠券id
      mId = dataObj.merchantId, // 商家id
      uId = dataObj.userCouponId;
    
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        coupon_id: cId,
        param_data: {
          'merchant_id': mId,
          'user_coupon_id': uId
        }
      },
      method: 'post',
      success: function (res) {
        // 处理优惠券的数据
        that.processCouponData(res.data);
      }
    });
  },
  /**
   * 处理优惠券信息
   */
  processCouponData: function (data) {
    let that = this;

    // 使用条件
    let useCondition = '';
    // 可领取用户
    let stampsUser = '';
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
    } else if (data.type == 6) {
      useCondition = '可使用' + parseInt(data.value) + '次';
    }
    if (data.user_condition_list && data.user_condition_list.length > 0) {
      data.user_condition_list.forEach((res, i) => {
        if (i == data.user_condition_list.length - 1) {
          stampsUser = stampsUser + res
        } else {
          stampsUser = stampsUser + res + ','
        }
      })
    } else {
      if (data.user_condition == '0') {
        stampsUser = '所有用户'
      }
      if (data.user_condition == '1') {
        stampsUser = '所有会员'
      }
    }
    let newData = data;
    newData['useCondition'] = useCondition;
    newData['stampsUser'] = stampsUser;
    that.setData({
      'couponDetail': newData
    });

  },
  /**
   * 获取商家二维码
   */
  getMerchantQRCode: function () {
    let that = this,
      dataObj = this.data;

    let appId = dataObj.merchantId,
      path = '', scene = '';
      
    if (+dataObj.couponStatus === 1) { // 兑换状态才需要到webview页面，其他状态跳首页
      path = 'differentialMall/pages/dMWebView/dMWebView';
      // 二维码参数带上userCouponId和couponId
      scene = encodeURIComponent(`${dataObj.userCouponId}&${dataObj.couponId}`);
    } else { // 商家首页
      path = '';
      scene = '';
    }

    app.sendRequest({
      url: '/index.php?r=api/Tool/GenerateQRCode',
      data: {
        app_id: appId,
        qrcode_type: 0,
        path: path,
        scene: scene
      },
      success: function (res) {
        that.setData({
          'couponDetail.merchantsQRCode': res.data || ''
        });
      }
    });
  },
  /**
   * 立即兑换点击事件
   */
  exchangeBtnHandler: function (e) {
    let that = this,
      datasetObj = e.currentTarget.dataset;

    let couponId = datasetObj.id,   // 优惠券id
      merchantId = datasetObj.mid; // 商家id

    app.showModal({
      title: '是否确认兑换？',
      content: '注：兑换成功后不支持退换',
      showCancel: true,
      cancelColor: '#666',
      confirmColor: '#ff7100',
      confirm: function (res) {
        // 点击确定
        if (res.confirm) {
          app.sendRequest({
            url: '/index.php?r=CrossPlatform/ExchangeCoupon',
            data: {
              coupon_id: couponId,
              merchant_id: merchantId
            },
            success: function (res) {
              if (res.status == 0 && res.data != 1 && res.msg === undefined) {
                // 跳转到兑换成功引导页
                app.turnToPage(`/differentialMall/pages/dMCouponSuccess/dMCouponSuccess?mId=${merchantId}&cId=${couponId}&uId=${res.data}`);
              } else {
                // 兑换不成功 toast提示
                that.showToast(res.msg,);
              }
            }
          });
        }
      }
    });
  },
  /**
   * 预览二维码
   */
  previewQRCode: function (e) {
    let imgSrc = e.currentTarget.dataset.imgSrc;
    if (!imgSrc) { return false; };
    app.previewImage({
      current: imgSrc,
      urls: [imgSrc]
    });
  },
  /**
   * 显示toast
   */
  showToast: function (title, duration = 1500) {
    this.setData({
      'toastInfo.isShow': true,
      'toastInfo.tipTxt': title
    });
    setTimeout(() => {
      this.setData({
        'toastInfo.isShow': false,
        'toastInfo.tipTxt': '',
      });
    }, duration);
  },
})