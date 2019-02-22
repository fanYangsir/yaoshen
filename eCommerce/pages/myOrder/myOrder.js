
var app = getApp()
var util = require('../../../utils/util.js')
var formatTime = util.formatTime;
Page({
  data: {
    orderLists: [],
    pages: 1,
    hiddenmodalput: true,
    untimes: '', // 次数券的次数
    numberOfStampsUrl: '',
    addLabelText: '',
    types: {      // 只有一种商品订单时，types保存商品订单的五个分类
      // 订单状态   0待付款 1待发货（已付款） 2待收货 3待评价 4退款审核 5退款中 6成功 7关闭
      0: [undefined, 0, 1, 2, 3],     // 电商
      1: [undefined, 0, 1, 2, 3],     // 预约
      2: [undefined, 0, 6, 7],        // 外卖
      3: [undefined, 0, 1, 2, 3, 'refund_status', 7],     // 到店
      5: [undefined, 0, 6, 7],        // 当面付
      6: [undefined, 2, 6, 7],        // 排号
      8: [undefined, 0, 1, 7],         // 其他（购卡）
      9: [undefined, 0, 1, 7],         // 其他（兑换券）
      10: [undefined, 0, 1, 2, 3],
      21: [undefined, 0, 1, 2, 10, 3], //社区团购
    },
    transportStatus: {
      0: '待创建',
      1: '待骑手接单',
      2: '骑手已接单', //蜂鸟已分配骑手
      3: '骑手配送中',
      4: '骑手配送已完成',
      5: '已取消',
      7: '已过期',
      8: '指派单',
      9: '妥投异常之物品返回中',
      10: '妥投异常之物品返回完成',
      11: '骑手已到店',
      12: '申请取消配送',
      1000: '订单异常'
    },
    noMore: false,
    currentTabIndex: 0,
    currentGoodsType: '',
    goodsTypeList: [],
    isFromBack: false,
    marker: [{
      latitude: 0,
      longitude: 0,
      iconPath: '/images/transport.png',
      width: 75,
      height: 75
    }],
    toStoreSetting: '',
    showWriteOffCodeBox: false
  },
  verifiTimeInterval: '',
  onLoad: function(options){
    if (options.goodsType && options.currentIndex){
      this.setData({
        currentGoodsType: options.goodsType,
        currentTabIndex: options.currentIndex
      })
    }
    this.dataInitial();
  },
  onShow: function(){
    if (this.data.isFromBack) {
      this.setData({
        pages:1,
        currentTabIndex: this.data.currentTabIndex,
        noMore: false
      });
      this.getOrderList({ tabIndex: this.data.currentTabIndex});
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  dataInitial: function(){
    var that = this;
    this.getTakeOutInfo();
    this.getAppECStoreConfig();
    this.getOrderList({
      tabIndex: that.data.currentTabIndex,
      firstLoad: true
    });
  },
  getOrderList: function(param){
    var that = this,
        data = {
          page: that.data.pages,
          page_size: 25
        },
        type;
    var good_type = this.data.currentGoodsType;
    if (this.data.currentGoodsType != ""){
      type = this.data.types[this.data.currentGoodsType][param.tabIndex];
      if(type != undefined){
        data.idx_arr = {
          idx: 'status',
          idx_value: type
        }
      }

      if (good_type == 0) {
        data.screening_cond = {
          is_distribution_order: ''
        }
      }
      if (good_type == 21) {
        good_type = 0;
        data.screening_cond = {
          is_distribution_order: 2
        }
      }

      data.goods_type = good_type

      if (data.goods_type == 10 && type == null) {
        data.idx_arr = {
          idx_value:''
        };
      }
    }else {
      data.screening_cond = {
        is_distribution_order: ''
      }
    }

    data.parent_shop_app_id = app.getAppId(); // 获取订单列表时 传parent_shop_app_id获取本店以及所有子店的订单
    data.not_get_takeout = 1; //不获取店铺信息（在getTakeOutInfo请求）

    if(param.firstLoad && this.data.currentGoodsType == ""){
    // 进入页面首次请求列表时 没有goodsType值 传入use_default_goods_type
      data.use_default_goods_type = 1;
    }
    if (data.goods_type == 9 || data.goods_type == 8) {
      data.goods_type = [8, 9]
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/orderList',
      method: 'post',
      data: data,
      success: function(res){
        let data = {},
            orders = res.data;

        for (var i = orders.length - 1; i >= 0; i--) {
          var formData = orders[i].form_data;
          if (formData.appointment_order_info && formData.appointment_order_info.appointment_unit_type == '6') {
            formData.timeDiff = Date.parse(new Date()) - Date.parse(new Date(formData.appointment_time.split('~')[1])) > 0 ? true : false;
          } else {
            formData.timeDiff = false;
          }
          if(formData.tostore_data && formData.tostore_data.appointed_time){
            formData.tostore_data.appointed_time = formData.tostore_data.appointed_time.substr(11, 5);
          }
          if (formData.goods_type == 2 && formData.status == 2 && formData.take_out_info.deliver_type != 0 && formData.take_out_info.deliver_type != '' && (formData.take_out_transport_order.status == 2 || formData.take_out_transport_order.status == 3 || formData.take_out_transport_order.status == 11) ){
            that.getTransportInfo(formData.order_id, i)
          }
          if (formData.goods_type == 8 && formData.goods_info.num){
            formData.goods_info.cNum = that.NumberToChinese(formData.goods_info.num)
          }
          if (formData.goods_type == 2) {
            let goodNum = 0;
            for (let j = 0; j < formData.goods_info.length; j++) {
              goodNum += +formData.goods_info[j].num;
            }
            data['goodsNum'] = goodNum;
          }
          if(formData.goods_type == 10){
              let newAppointmentData = {
                      serveInfo : [],
                      toStoreTime:'',
                      toStoreTimeEnd:'',
                      duration:'',
                      providerList:[],
                      providerTitle:''
                  },
                  new_appointment = formData.service.new_appointment,
                  doc_info = new_appointment.doc_info,
                  elem_info = new_appointment.elem_info,
                  worker_info = new_appointment.worker_info;
                  for (let i = 0; i < doc_info.length; i++) {
                    newAppointmentData.serveInfo.push({
                      label: doc_info[i].name,
                      value: elem_info[i].name
                    })
                  };
                  for (let i = 0; i < worker_info.length; i++) {
                    newAppointmentData.providerList.push({
                      name: worker_info[i].name,
                    })
                  };
              newAppointmentData.toStoreTime = formatTime( new Date(+formData.service.new_appointment_info.spu[0].interval[0].new_appointment_start_date*1000)).slice(0,16);
              newAppointmentData.toStoreTimeEnd = formatTime( new Date(+formData.service.new_appointment_info.spu[0].interval[0].new_appointment_end_date*1000)).slice(11,16);
              newAppointmentData.duration = +formData.service.new_appointment_info.spu[0].new_appointment_work_sec/60;
              newAppointmentData.goods_price = formData.service.goods_price;
              newAppointmentData.endDate = newAppointmentData.toStoreTime.slice(0,10);
              newAppointmentData.providerTitle = new_appointment.manage_alias;
              formData.newAppointmentData = newAppointmentData;
          }
          orders[i] = formData;
        }

        if(param.scrollLoad){
          orders = that.data.orderLists.concat(orders);
        }
        data['orderLists'] = orders;
        // data['takeoutInfo'] = res.take_out_info || '';
        data['pages'] = that.data.pages + 1;
        data['noMore'] = res.is_more == 0 ? true : false;
        if (typeof res.current_goods_type === 'object') {
          data['currentGoodsType'] = 9
        } else {
          data['currentGoodsType'] = res.current_goods_type;
        }
        // 判断goods_type_list里面是否存在当前需要展示的列表
        data['goodsTypeList'] = res.goods_type_list;
        if (data['goodsTypeList'].indexOf(data['currentGoodsType'].toString()) < 0){
          data['goodsTypeList'].push(data['currentGoodsType']);
        }
        if (data['goodsTypeList'].indexOf('0') >= 0) {
          data['goodsTypeList'].push('21');
          if (that.data.currentGoodsType == 21) {
            data['currentGoodsType'] = 21;
          }
        }
        that.setData(data);
        if (param.firstLoad && data['goodsTypeList'].indexOf('6') >= 0){
          that.getTostoreSetting();
        }
      }
    })
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText':e.detail.value})
  },
  // 兑换券使用
  goToUseStamps: function(event){
    let couponId = event.currentTarget.dataset.couponid;
    let appid = app.globalData.appId;
    let franisee = '';
    let untimes = event.currentTarget.dataset.untimes;
    franisee = '&franchisee=' + appid;
    let url = '/exchangeCoupon/pages/numberOfStampsUsed/numberOfStampsUsed?detail=' + couponId + franisee;
    this.setData({numberOfStampsUrl: url, hiddenmodalput: false, untimes: untimes})
    // app.turnToPage(url, false);
  },
  confirm: function() {
    if (+this.data.untimes < +this.data.addLabelText) {
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
  getTransportInfo: function (orderId, i){
    let that = this,
        newdata = {};
    app.sendRequest({
      url: '/index.php?r=AppTransport/queryTransporterInfo',
      data: {
        order_id: orderId,
      },
      success: function (res) {
        // res.data.statusCode 订单状态(待接单＝1 待取货＝2 配送中＝3 已完成＝4 已取消＝5 已过期＝7 指派单=8 妥投异常之物品返回中=9 妥投异常之物品返回完成=10 系统故障订单发布失败=1000 可参考文末的状态说明
        newdata['orderLists[' + i + '].transport'] = res.data
        newdata['marker[0].latitude'] = res.data.transporterLat
        newdata['marker[0].longitude'] = res.data.transporterLng
        that.setData(newdata)
      }
    })
  },
  mapDetail:function(e){

    let dataset = e.currentTarget.dataset,

        marker = [{
          latitude: dataset.lat,
          longitude: dataset.lng,
          iconPath: '/images/transport.png',
          width: 75,
          height: 75
        }]

    app.turnToPage("/default/pages/mapDetail/mapDetail?eventParams=" + JSON.stringify(marker))
  },
  clickOrderTab: function(e){
    var dataset = e.target.dataset,
        index = dataset.index,
        data = {};

    data.currentTabIndex = index;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;

    this.setData(data);
    this.getOrderList({tabIndex : index});
  },
  clickMeanTab: function(e){
    var dataset = e.target.dataset,
      index = dataset.index,
      data = {};

    data.currentTabIndex = 0;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;
    data.currentGoodsType = dataset.goodsType;

    this.setData(data);
    this.getOrderList({ tabIndex: 0 });
  },
  // 多种商品下面的子菜单
  clickSubmenuTab: function(e){
    var dataset = e.target.dataset,
        index = dataset.index,
        data = {};

    data.currentTabIndex = index;
    data['pages'] = 1;
    data['orderLists'] = [];
    data['noMore'] = false;
    data.currentGoodsType = e.currentTarget.dataset.goodsType;

    this.setData(data);
    this.getOrderList({ tabIndex: index });
  },
  goToOrderDetail: function(e){
    var dataset = e.currentTarget.dataset,
        orderId = dataset.id,
        type = dataset.type,
        franchiseeId = dataset.franchisee,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee='+franchiseeId,
        router;
    if(type === 'transfer'){
      router = '/eCommerce/pages/transferOrderDetail/transferOrderDetail?detail=';
    }else if(type === 'tostore'){
      router = '/orderMeal/pages/tostoreOrderDetail/tostoreOrderDetail?detail=';
    } else if(type === 'eBusiness') {
      router = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=';
    } else if (type === 'takeout'){
      router = '/orderMeal/pages/takeoutOrderDetail/takeoutOrderDetail?detail=';
    } else if (type === 'rowNumber') {
      router = '/orderMeal/pages/rowNumberOrderDetail/rowNumberOrderDetail?detail=';
    } else if (type === 'ExchangeCoupon') {
      router = '/exchangeCoupon/pages/numberOfStampsOrderDetail/numberOfStampsOrderDetail?detail=';
    } else if(type === 'newAppoint' ) {
        router = '/newAppointment/pages/newAppointmentOrderDetail/newAppointmentOrderDetail?detail=';
    } else if(type === 'communityGroup'){
      router = '/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?detail=';
    } else {
      router = '/eCommerce/pages/appointmentOrderDetail/appointmentOrderDetail?detail=';
    }
    app.turnToPage(router+orderId+queryStr);
  },
  //取消订单
  cancelOrder: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        appId = app.getAppId(),
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this;

    app.showModal({
      content: '你将要取消一笔付款订单，确认取消？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            app_id: appId,
            sub_shop_app_id: subShopId
          },
          success: function(res){
            var index = that.data.currentTabIndex,
                data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({tabIndex : index});
          }
        })
      },
      cancel: function() {

      }
    })
  },
  //删除订单
  orderDelete: function (e) {
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        appId = app.getAppId(),
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this;
    app.showModal({
      content: '确定删除此订单吗？删除后不可再恢复哦',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirmColor: '#FF7100',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/HideOrder',
          data: {
            order_id: orderId,
            app_id: appId,
            sub_shop_app_id: subShopId
          },
          success: function (res) {
            var index = that.data.currentTabIndex,
              data = {};
            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({ tabIndex: index });
          }
        })
      }
    })
  },
  //申请退款
  applyDrawback: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this,
        delivery = e.target.dataset.delivery;

    app.showModal({
      content: delivery == 1 ? '确定要取消订单？' : '确定要申请退款？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/applyRefund',
          data: {
            order_id: orderId,
            sub_shop_app_id: subShopId
          },
          success: function(res){
            var index = that.data.currentTabIndex,
                data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({tabIndex : index});
          }
        })
      }
    })
  },
  //撤销退款申请
  cancelRefund: function(e) {
    var orderId = e.target.dataset.id,
      franchisee = e.target.dataset.franchisee,
      appId = app.getAppId(),
      subShopId = franchisee == app.getAppId() ? '' : franchisee,
      that = this,
      delivery = e.target.dataset.delivery;
      app.showModal({
        content: '是否撤销取消订单申请？',
        showCancel: true,
        cancelText: '取消',
        confirmText: '确定',
        confirm: function () {
          app.sendRequest({
            url: '/index.php?r=AppShop/cancelRefund',
            data: {
              app_id: appId,
              order_id: orderId
            },
            success: function (res) {
              var index = that.data.currentTabIndex,
                data = {};
              data['pages'] = 1;
              that.setData(data);
              that.getOrderList({ tabIndex: index });
            }
          })
        }
      })
  },
  //跳转取消订单
  toCancelOrder: function(e){
    let orderId = e.target.dataset.id;
    let deliverType = e.target.dataset.deliver;
    var dataset = e.currentTarget.dataset,
        franchiseeId = dataset.franchisee;
    app.turnToPage('/orderMeal/pages/cancelOrder/cancelOrder?orderId=' + orderId + '&deliverType=' + deliverType + '&franchisee=' + franchiseeId);
  },
  checkLogistics: function(e){
    var orderId = e.target.dataset.id;
    app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?detail='+orderId);
  },
  sureReceipt: function(e){
    var orderId = e.target.dataset.id,
        franchisee = e.target.dataset.franchisee,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        that = this,
        content = this.data.currentGoodsType == '1'? '确认已消费?':'确认已收到货物?';

    app.showModal({
      content: content,
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: subShopId
          },
          success: function(res){
            var index = that.data.currentTabIndex,
            data = {},
            addTime = Date.now();
            
            data['pages'] = 1;
            that.setData(data);
            
            if (that.data.currentGoodsType == 0){
              app.turnToPage('/eCommerce/pages/transactionSuccess/transactionSuccess?pageFrom=transation&orderId=' + orderId + '&franchiseeId=' + subShopId);
            }else{
              that.getOrderList({tabIndex : index});
            }
            
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=appShop/getIntegralLog',
              data: { add_time: addTime },
              success: function (res) {
                if (res.status == 0) {
                  res.data && that.setData({
                    'rewardPointObj': {
                      showModal: true,
                      count: res.data,
                      callback: ''
                    }
                  });
                }
              }
            })
          }
        })
      }
    })
  },
  makeComment: function(e){
    var orderId = e.target.dataset.id,
        franchiseeId = e.target.dataset.franchisee,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee='+franchiseeId;
    app.turnToPage('/eCommerce/pages/makeComment/makeComment?detail='+orderId+queryStr);
  },
  takeoutMakeComment:function(e){
    var orderId = e.target.dataset.id,
      franchiseeId = e.target.dataset.franchisee,
      queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee=' + franchiseeId;
    app.turnToPage('/orderMeal/pages/takeoutMakeComment/takeoutMakeComment?detail=' + orderId + queryStr);
  },
  scrollToListBottom: function(){
    var currentTabIndex = this.data.currentTabIndex;
    if(this.data.noMore){
      return;
    }
    this.getOrderList({
      tabIndex: currentTabIndex,
      scrollLoad: true
    });
  },
  getTostoreSetting: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTostore/getTostoreLineUpSetting',
      success: function (res) {
        if (res.status == 0) {
          _this.setData({
            toStoreSetting: res.data
          })
        }
      }
    });
  },
  // 核销码
  getWriteOffCodeBox: function (event) {
    let _this = this;
    let orderId = event.target.dataset.id;
    let franchiseeId = event.target.dataset.franchisee;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: {
        'sub_shop_app_id': franchiseeId,
        'order_id': orderId
      },
      success: _this.setVerificationCodeData
    })
  },
  setVerificationCodeData: function (res) {
    let _this = this;
    _this.setData({
      'codeImgUrl': res.data.qrcode_url,
      'codeNum': res.data.code,
      'codeStatus': res.data.status,
      'showWriteOffCodeBox': true
    });
    _this.connectSocket();
  },
  connectSocket: function () {
    var _this = this;
    wx.connectSocket({
      url: 'wss://ceshi.zhichiwangluo.com',
      header: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });
    wx.onSocketOpen(function (res) {
      let data = {
        'action': 'mark_client',
        'user_token': app.globalData.userInfo.user_token,
        'scenario_name': 'app_order_verify',
        'session_key': app.globalData.sessionKey
      };
      wx.sendSocketMessage({
        data: JSON.stringify(data)
      });
      _this.verifiTimeInterval = setInterval(function () {
        let data = {
          'action': 'heartbeat',
          'user_token': app.globalData.userInfo.user_token,
          'scenario_name': 'app_order_verify',
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
        if ((msg.type == 'app_order_verify') && (msg.status == 0)) {
          _this.setData({
            'codeStatus': 1
          });
          clearInterval(_this.verifiTimeInterval);
          wx.closeSocket();
        }
      }
    });
  },
  hideWriteOffCodeBox: function () {
    var _this = this;
    this.setData({
      'showWriteOffCodeBox': false
    })
    clearInterval(_this.verifiTimeInterval);
    wx.closeSocket();
  },

  //再来一单
  onemore: function(){

  },

  //去付款
  toPayOrder: function() {

  },
  payOrder: function (event) {
    // var address_info = event.target.dataset.address,
    var that = this,
      orderId,
      price = event.target.dataset.price;
    var franchiseeId = event.target.dataset.franchisee;

    // if (!address_info && this.data.orderInfo.goods_type != 3) {
    //   app.showModal({
    //     content: '请选择邮寄地址'
    //   })
    //   return;
    // }
    orderId = event.target.dataset.id;

    if (price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          setTimeout(function () {
            app.showToast({
              title: '支付成功',
              icon: 'success'
            });
          });
          setTimeout(function () {
            var index = that.data.currentTabIndex,
              data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({ tabIndex: index });
          }, 1000);
        }
      });
      return;
    }

    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId,
        sub_shop_app_id: franchiseeId == app.getAppId() ? '' : franchiseeId,
      },
      success: function (res) {
        var param = res.data;

        param.orderId = orderId;
        param.goodsType = that.data.currentGoodsType;
        param.success = function () {
          setTimeout(function () {
            var index = that.data.currentTabIndex,
              data = {};

            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({ tabIndex: index });
          }, 1500);
        };
        app.wxPay(param);
      }
    })
  },
  getTakeOutInfo: function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getTakeOutInfo',
      success: function(res) {
        that.setData({
          takeoutInfo : res.data || ''
        })
      }
    })
  },
  receiveDrawback: function (e) {
    var orderId = e.target.dataset.id,
      franchisee = e.target.dataset.franchisee,
      appId = app.getAppId(),
      subShopId = franchisee == app.getAppId() ? '' : franchisee,
      that = this;

    app.showModal({
      content: '确定已收到退款？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmRefund',
          data: {
            order_id: orderId,
            sub_shop_app_id: subShopId
          },
          success: function (res) {
            var index = that.data.currentTabIndex,
                data = {};
            data['pages'] = 1;
            that.setData(data);
            that.getOrderList({ tabIndex: index });
          }
        })
      }
    })
  },
  SectionToChinese: function(section){
    let strIns = '', chnStr = '';
    let unitPos = 0;
    let zero = true;
    let chnNumChar = ["零","一","二","三","四","五","六","七","八","九"];
    let chnUnitSection = ["","万","亿","万亿","亿亿"];
    let chnUnitChar = ["","十","百","千"];

    while(section > 0){
      let v = section % 10;
      if(v === 0){
      if(!zero){
          zero = true;
          chnStr = chnNumChar[v] + chnStr;
      }
    }else{
      zero = false;
      strIns = chnNumChar[v];
      strIns += chnUnitChar[unitPos];
      chnStr = strIns + chnStr;
      }
      unitPos++;
      section = Math.floor(section / 10);
    }
    return chnStr;
  },
  NumberToChinese: function (num){
    let unitPos = 0;
    let strIns = '', chnStr = '';
    let needZero = false;
    let chnUnitSection = ["","万","亿","万亿","亿亿"];
    let chnNumChar = ["零","一","二","三","四","五","六","七","八","九"];

    if(num === 0){
        return chnNumChar[0];
    }

    while(num > 0){
      let section = num % 10000;
      if(needZero){
          chnStr = chnNumChar[0] + chnStr;
      }
      strIns = this.SectionToChinese(section);
      strIns += (section !== 0) ? chnUnitSection[unitPos] : chnUnitSection[0];
      chnStr = strIns + chnStr;
      needZero = (section < 1000) && (section > 0);
      num = Math.floor(num / 10000);
      unitPos++;
    }

    return chnStr;
  },
  //新预约查看券码
  toSeeQrcode(event) {
    let orderId = event.target.dataset.id,
      franchiseeId = event.target.dataset.franchisee,
      codeEndDate = event.target.dataset.enddate,
      pagePath = '/newAppointment/pages/newAppointmentQrcode/newAppointmentQrcode?orderId=' + orderId + '&franchiseeId=' + franchiseeId + '&codeEndDate=' + codeEndDate;
    app.turnToPage(pagePath);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hasRecommendConfig: res.recommend_config ? true : false
      })
    });
  }
})
