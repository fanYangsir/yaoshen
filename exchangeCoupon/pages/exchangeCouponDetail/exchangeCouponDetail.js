var app = getApp()

Page({
  data: {
    couponId: '',       // receive时为商家设置优惠券id，use时为用户领取优惠券id
    couponDetail: {},
    receiveSuccess: 0,  // 领取成功弹窗是否显示
    receiveCount: 0,    // 已领取数量
    receiveLimitNum: 0, // 领取限制数量
    rechargeSuccess: 0, // 充值成功弹窗是否显示
    verifySuccess: false,
    verifyQrcodeUrl: '',
    verifyShow: false,
    style: '',
    verifyData: {
      success: false,
      qrcodeUrl: ''
    }
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
  onLoad: function (options) {
    let that = this;
    let exchangeCouponDetail = app.globalData.exchangeCouponStyle
    let style = {}
    if (exchangeCouponDetail) {
      let styleArr = this.cutStyle(exchangeCouponDetail.style)
      style.strStyle = styleArr
      style.lineBackgroundColor = exchangeCouponDetail.customFeature.lineBackgroundColor
      style.secColor = exchangeCouponDetail.customFeature.secColor
    }
    let id = options.id 
    that.setData({
      'couponId': id,
      'style': style
    });
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        'app_id': app.globalData.appId,
        'coupon_id': id
      },
      hideLoading: true,
      success: function(res){
        that.setCouponData(res.data);
      }
    });
  },
  setCouponData: function (data) {
    let that = this;
    let useCondition = '';
    let stampsType, stampsUser = '';
    if (data.type == 0) {
      useCondition = '满' + data.condition + '，减' + data.value + '元';
      stampsType = '满减券'
    } else if (data.type == 1) {
      useCondition = '打' + data.value + '折';
      stampsType = '打折券'
    } else if (data.type == 2) {
      useCondition = '可抵扣' + data.value + '元';
      stampsType = '代金券'
    } else if (data.type == 3) {
      if (data.extra_condition == '') {
        useCondition = '直接兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.price) {
        useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.goods_id) {
        useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
      }
      stampsType = '兑换券'
    } else if (data.type == 4) {
      useCondition = '储值金可充值' + data.value + '元';
      stampsType = '储值券'
    } else if (data.type == 5) {
      useCondition = data.extra_condition;
      stampsType = '通用券'
    } else if (data.type == 6) {
      useCondition = '可使用' + parseInt(data.value) + '次';
      stampsType = '次数券'
    }
    let newData = data;
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
    newData['useCondition'] = useCondition;
    newData['stampsType'] = stampsType;
    newData['stampsUser'] = stampsUser;
    that.setData({
      'couponDetail': newData
    });
  },
  // 领取优惠券
  formSubmit: function (event) {
    let that = this
    let couponDetail = that.data.couponDetail
    if (couponDetail.recv_status == 0) {
      app.showModal({content: '超过可兑换次数'});
      return
    }
    if (couponDetail.exchange_condition.price !== 0) {
      app.turnToPage('/exchangeCoupon/pages/exchangeCouponDetailOrder/exchangeCouponDetailOrder?id=' + couponDetail.id);
      return 
    }
    app.showModal({
      title: '是否确认兑换？',
      content: '注：兑换成功后不支持退换',
      showCancel: true,
      cancelText: "否",
      confirmText: "是",
      confirm : function(){
        app.sendRequest({
          url: '/index.php?r=appCoupon/addCouponOrder',
          data: {
            'app_id': app.globalData.appId,
            'id': couponDetail.id
          },
          hideLoading: true,
          success: function (res) {
            if (res.status !== 0) {          
              return
            }
            if (couponDetail.limit_num >= couponDetail.user_recv_num + 1) {
              let newData = couponDetail
              newData.user_recv_num ++ 
              that.setData({
                'receiveSuccess': 1,
                'couponDetail': newData
              });        
            } else {
              let newData = couponDetail
              newData.recv_status = 0
              that.setData({
                'receiveSuccess': 1,
                'couponDetail': newData
              });            
            }
            setTimeout(function() {
              that.hideReceiveToast(); 
            }, 3000);
          },
          complete: function (res) {
            // if (res.status === 0) {
            //   return
            // }
            // let newData = couponDetail
            // newData.recv_status = 0
            // that.setData({
            //   'couponDetail': newData
            // });      
          }
        });
      } 
    });
  },
  // 关闭领取成功弹窗
  hideReceiveToast: function(){
    this.setData({
      'receiveSuccess': 0
    });
  },
  // 关闭充值成功弹窗
  hideRechargeToast: function(){
    this.setData({
      'rechargeSuccess': 0
    });
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
        if ((msg.type == 'app_coupon_verify') && (msg.status == 0)) {
          that.setData({
            'verifyData.success': true,
            'couponDetail.status': 2
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
  },
})
