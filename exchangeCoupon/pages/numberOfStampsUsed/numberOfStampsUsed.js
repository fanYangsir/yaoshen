
var app = getApp()

Page({
  data: {
    verifyData: {
      success: false,
      qrcodeUrl: ''
    },
    useNumber: 1,
    couponDetail: {

    }
  },
  onShow: function () {

  },
  // 每个页面数据初始化函数 dataInitial
  onLoad: function (options) {
    let that = this;
    let couponId = options.detail || ''; // receive时为优惠券Id, use时为用户领取的优惠券Id
    let franchiseeId = options.franchisee || '';
    let useNumber = options.Number || 1;
    app.sendRequest({
      url: '/index.php?r=AppShop/getUserListCouponInfo',
      data: {
        'sub_app_id': franchiseeId,
        'user_coupon_id': couponId
      },
      hideLoading: true,
      success: function(res){
        that.setData({couponDetail: res.data[0],useNumber: useNumber})
        that.getWriteOffCodeBox()
      }
    });
  },
  // 核销码
  getWriteOffCodeBox: function(){
    var qrcodeUrl = `${app.globalData.siteBaseUrl}` + 
    `/index.php?r=AppShop/couponQrcode&app_id=${(this.data.franchiseeId ? this.data.franchiseeId : app.globalData.appId)}` + 
    `&user_coupon_id=${this.data.couponDetail.id}&consume_times=${this.data.useNumber}`;
    this.setData({
      'verifyData.qrcodeUrl': qrcodeUrl
    });
    this.connectSocket();
  },
  // 关闭验证码
  hideCouponVerify: function(){
    let that = this
    clearInterval(this.timeInterval);
    this.socketOpen && wx.closeSocket();
    app.turnBack();
  },
  timeInterval: '',// 定时器,间断发送消息
  socketOpen: false,
  connectSocket: function () {
    var that = this;
    wx.connectSocket({
      // url: 'wss://ceshi.zhichiwangluo.com', //线下test
      // url: 'wss://xcx.zhichiwangluo.com', //testonly
      // url: 'wss://xcx.weiye.me', //预上线
      url: 'wss://xcx.jisuapp.cn', //线上
      header: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });
    wx.onSocketOpen(function (res) {
      that.socketOpen = true;
      console.log('打开WebSocket')
      let data = {
        'action': 'mark_client',
        'user_token': app.globalData.userInfo.user_token,
        'scenario_name': 'app_coupon_verify',
        'session_key': app.globalData.sessionKey
      };
      wx.sendSocketMessage({
        data: JSON.stringify(data)
      });
      that.timeInterval = setInterval(function () {
        console.log('打开轮询')
        let data = {
          'action': 'heartbeat',
          'user_token': app.globalData.userInfo.user_token,
          'scenario_name': 'app_coupon_verify',
          'session_key': app.globalData.sessionKey
        };
        wx.sendSocketMessage({
          data: JSON.stringify(data)
        })
      }, 30000);
    });
    wx.onSocketMessage(function (res) {
      let data = JSON.parse(res.data);
      if (data.action == 'push_to_client') {
        let msg = JSON.parse(data.msg);
        console.log(msg)
        if ((msg.type == 'app_coupon_verify') && (msg.status == 0)) {
          that.setData({
            'verifyData.success': true
            // 'couponDetail.status': 2
          });
          clearInterval(that.timeInterval);
          wx.closeSocket();
        }
      }
    });
    wx.onSocketClose(function(res) {
      that.socketOpen = false;
      clearInterval(that.timeInterval);
      console.log('WebSocket 已关闭！');
    });
    wx.onSocketError(function(res){
      that.socketOpen = false;
      console.log('WebSocket连接打开错误，请检查！')
    })
  },
  onUnload: function () {
    var that = this;
    clearInterval(that.timeInterval);
    that.socketOpen && wx.closeSocket();
  }
})
