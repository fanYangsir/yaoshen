// differentialMall/pages/dMWebView/dMWebView.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isActiveCoupon: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let uId = '',
      cId = '',
      isActiveCoupon = false;

    // 二维码进入
    if (options && options.scene) {
      // 解码参数
      let scene = decodeURIComponent(options.scene);
      uId = scene.split('&')[0]; // 第一个参数 用户优惠券记录id
      cId = scene.split('&')[1]; // 第二个参数 优惠券id
      isActiveCoupon = true; // 是否激活优惠券

      this.setData({
        userCouponId: uId,
        couponId: cId,
        isActiveCoupon: isActiveCoupon
      });
    }

    
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this,
      globalDataObj = app.globalData;
    
    let sessionKey = globalDataObj.sessionKey;

    // 没有sessionKey的话去登录
    if (sessionKey) {
      // console.log(`全局sessionKey:${sessionKey}`)
      this.turnToIndex(sessionKey);
    } else {
      let isLogin = app.isLogin();
      if (!isLogin) {
        app.goLogin({
          success: function () {
            // 登录成功
            sessionKey = globalDataObj.sessionKey || wx.getStorageSync('session_key');
            // console.log(`登陆后的session_key:${sessionKey}`);
            that.turnToIndex(sessionKey);
          }
        });
      }
    }
  },
  /**
   * 重定向到微分商城首页
   */
  turnToIndex: function(sessionKey) {
    let that = this, 
      dataObj = this.data,
      globalDataObj = app.globalData;

    let baseUrl = globalDataObj.userDomain;
    let appId = globalDataObj.appId;
    // 跳转的页面
    let turnPage = '';
    if (!dataObj.isActiveCoupon) { // 不是激活优惠券跳转到微分商城首页
      turnPage = '/differentialMall/pages/dMCouponsMall/dMCouponsMall';
    } else { // 是激活优惠券则返回激活页
      turnPage = `/differentialMall/pages/dMCouponActive/dMCouponActive?uId=${dataObj.userCouponId}&cId=${dataObj.couponId}`;
    }

    // 请求接口 判断是否需要web-view登录
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/IsLogin',
      hideLoading: true,
      success: function (res) {
        let returnDate = res.data;
        console.log(returnDate)
        if (returnDate == 1) {
          // 不需要 ==> 直接跳转
          wx.redirectTo({
            url: turnPage,
          });
        } else {
          // 需要  ==> web-view登录
          let requestUrl = baseUrl + '/index.php?r=WxUserBind/Index&app_id=' + appId + '&_app_id=' + appId + '&session_key=' + sessionKey + '&path=' + encodeURIComponent(turnPage);
          // console.log(requestUrl)
          that.setData({
            webRequestUrl: requestUrl
          });
        }
      }
    });
  }
})