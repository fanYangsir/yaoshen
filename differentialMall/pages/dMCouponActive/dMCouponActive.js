// differentialMall/pages/dMCouponActive/dMCouponActive.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    merchantId: '',
    userCouponId: '',
    couponId: '',
    toastInfo: {
      isShow: false,
      tipTxt: ''
    },
    couponDetail: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 商家id
    let mId = app.globalData.appId,
      uId = '',
      cId = '';

    if (options) { 
      uId = options && options.uId;
      cId = options && options.cId;
    }

    this.setData({
      userCouponId: uId,
      couponId: cId,
      merchantId: mId
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getCouponDetail();
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
    if (+data.status === 2) {
      that.showToast('优惠券已激活，2s后将跳到首页', 3000);
      // 2s后跳转到首页
      setTimeout(function () {
        that.turnToHomePage();
      }, 2000);
    }
  },

  /**
   * 激活优惠券
   */
  activeCoupon: function () {
    let that = this,
      dataObj = this.data;

    // 只有兑换成功才需要激活，其他状态不需要激活
    if (+dataObj.couponDetail.status > 1) {
      return false;
    }

    let couponId = dataObj.couponId,
      userCouponId = dataObj.userCouponId;

    app.sendRequest({
      url: '/index.php?r=CrossPlatform/ActivationCoupon',
      data: {
        coupon_id: couponId,
        user_coupon_id: userCouponId
      },
      success: function () {
        // 激活成功提示
        that.showToast('激活成功');
        // 更新优惠券的状态
        that.setData({
          'couponDetail.status': 2
        });
        // 2s后跳转到首页
        setTimeout(function(){
          that.turnToHomePage();
        },2000);
      }
    });
  },
  /**
   * 跳转到首页
   */
  turnToHomePage: function() {
    // 首页名称
    let homePage = app.globalData.homepageRouter;
    app.turnToPage(`/pages/${homePage}/${homePage}`, true);
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