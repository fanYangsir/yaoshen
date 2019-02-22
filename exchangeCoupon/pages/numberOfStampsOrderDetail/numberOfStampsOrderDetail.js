
var app = getApp()

Page({
  data: {
    orderData: {},
    orderInfo: {},
    hiddenmodalput: true,
    untimes: '', // 次数券的次数
    numberOfStampsUrl: '',
    addLabelText: '',
    status_name: {},
    goodsAdditionalInfo: {},
    hasAdditionalInfo: false,
    customFields: [],
    orderId: '',
    isFromTemplateMsg: false,
    originalPrice: '',
    useBalance: '',
    freightAdress:{},
    express_fee:'',
    discount_cut_price: '',
    isFromBack: false,
    showWriteOffCodeBox: false,
    showEventDialog: false,
    eventType: '',
    detailShow: true,
    cerificationShow: false,
    verifyShow: false,
    verifyData: {
      success: false,
      qrcodeUrl: ''
    }
  },
  verifiTimeInterval: '', // 定时器,间断发送消息
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      franchiseeId: options.franchisee || ''
    })
    this.dataInitial();
  },
  onShow: function () {
    if (this.data.isFromBack) {
      if (!!this.data.orderInfo.order_id) {
        this.getOrderDetail(this.data.orderInfo.order_id);
      }
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  // 每个页面数据初始化函数 dataInitial
  dataInitial: function () {
    this.getOrderDetail(this.data.orderId);
    this.getAppECStoreConfig();
    this.setData({
      appName: app.globalData.appTitle,
      appLogo: app.globalData.appLogo
    })
  },
  getAppECStoreConfig: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getAppECStoreConfig',
      data: {
        'sub_shop_app_id': _this.data.franchiseeId
      },
      success: function (res) {
        // _this.setData({
        //   refundAdress: res.data.refund_config.address,
        //   refundWithGoods: res.data.refund_config.refund_with_goods,
        //   isFullRefund: res.data.refund_config.is_full_refund,
        // })
      }
    })
  },
  getVerificationInfo: function () {
    this.setData({
      'detailShow': false,
      'cerificationShow': true
    });
  },
  getOrderDetail: function (orderId) {
    var that = this;
    app.getOrderDetail({
      data: {
        order_id: orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        var data = res.data[0],
            form_data = data.form_data,
            hasAdditionalInfo = false,
            additional_info_goods = [],
            additional_goodsid_arr = [],
            address_id = '';
        
        if (form_data.additional_info){
          for (var i = 0; i < form_data.goods_info.length; i++) {
            var deliveryId = form_data.goods_info[i].delivery_id,
                goodsId = form_data.goods_info[i].goods_id;
  
            if (deliveryId && deliveryId != '0' && additional_goodsid_arr.indexOf(goodsId) == -1) {
              additional_info_goods.push(form_data.goods_info[i]);
              additional_goodsid_arr.push(goodsId);
              hasAdditionalInfo = true;
            }
          }
        }
        
        let remark = form_data.remark;
        let status_name
        form_data.remark = remark ? remark.replace(/\n|\\n/g, '\n') : remark;
        switch(form_data.status) {
          case '0': status_name = '未付款'; 
                  break;
          case '1': status_name = '已付款'; 
                  break;
          case '7': status_name = '已关闭'; 
                  break;
        }
        that.setData({
          orderData: data,
          orderInfo: form_data,
          hasAdditionalInfo: hasAdditionalInfo,
          discount_cut_price: form_data.discount_cut_price,
          useBalance: form_data['use_balance'],
          express_fee: res.data[0]['express_fee'],
          status_name: status_name
        });
        app.setPreviewGoodsInfo(additional_info_goods);

        app.setGoodsAdditionalInfo(form_data.additional_info || {});
      }
    })
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  copyOrderId: function(){
    let _this = this;
    wx.setClipboardData({
      data: _this.data.orderId,
      success: function (res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText':e.detail.value})
  },
  confirm: function() {
    if (+this.data.orderInfo.un_verify_times < +this.data.addLabelText) {
      app.showModal({content: '核销次数超过剩余次数'});
      this.setData({hiddenmodalput: true, addLabelText: ''})
      return
    }
    let url = this.data.numberOfStampsUrl + '&Number=' +  this.data.addLabelText
    this.setData({hiddenmodalput: true, addLabelText: ''})
    app.turnToPage(url, false);
  },
  cancel: function () {
    this.setData({hiddenmodalput: true, addLabelText: ''})
  },
  // 核销码
  getWriteOffCodeBox: function(){
    let couponId = this.data.orderInfo.user_coupon_id
    let franisee = this.data.franchiseeId ? this.data.franchiseeId : app.globalData.appId
    let url = '/exchangeCoupon/pages/numberOfStampsUsed/numberOfStampsUsed?detail=' + couponId + '&franchisee=' +  franisee;
    this.setData({numberOfStampsUrl: url, hiddenmodalput: false})
    // app.turnToPage(url, false);
    // var qrcodeUrl = `${app.globalData.siteBaseUrl}`+
    // `/index.php?r=AppShop/couponQrcode&app_id=${(this.data.franchiseeId ? this.data.franchiseeId : app.globalData.appId)}` +
    // `&user_coupon_id=${this.data.orderInfo.user_coupon_id}`;
    // this.setData({
    //   'detailShow': false,
    //   'verifyShow': true,
    //   'verifyData.qrcodeUrl': qrcodeUrl
    // });
    // this.connectSocket();
  },
  // 关闭验证码
  hideCouponVerify: function(){
    this.setData({
      'detailShow': true,
      'verifyShow': false,
      'cerificationShow': false
    });
    clearInterval(this.timeInterval);
    this.socketOpen && wx.closeSocket();
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
  },
})
