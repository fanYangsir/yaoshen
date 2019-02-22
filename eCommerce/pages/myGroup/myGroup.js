
var appInstance = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    param: {
      page: 1,
      page_size: 5,
      is_leader_order: 1,
      current_status: 0
    },
    isLeader: 1,
    status: 0,
    noMore: false,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    
    appInstance.globalData.myGroupRefresh = false;
    _this.getMyGroupBuy();
  },
  onShow: function(){
    if (appInstance.globalData.myGroupRefresh){
      this.setData({
        param: {
          page: 1,
          page_size: 5,
          is_leader_order: 1,
          current_status: 0
        }
      })
      this.getMyGroupBuy();
      appInstance.globalData.myGroupRefresh = false;
    }
  },
  getMyGroupBuy: function(){
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppGroupBuy/MyGroupBuy',
      data: _this.data.param,
      success: function (data) {
        _this.setData({ list: data.data });
      }
    })
  },
  onShareAppMessage: function (e) {
    let that = this,
        url = '/pages/myGroup/myGroup',
        title = '',
        imageUrl = '';
    if (e.from == 'button') {
      let index = e.target.dataset.index,
        info = this.data.list[index],
        groupInfo = info.form_data.group_buy_order_info,
        teamToken = info.team_token,
        goodsInfo = info.form_data.goods_info[0],
        franchisee = info.app_id == appInstance.getAppId() ? '' : '&franchisee=' +info.app_id;
      url = '/eCommerce/pages/joinGroupDetail/joinGroupDetail?detail=' + groupInfo.goods_id + '&teamToken=' + teamToken + franchisee + (appInstance.globalData.pageShareKey ? ('&pageShareKey=' + appInstance.globalData.pageShareKey) : '');
      title = appInstance.getUserInfo('nickname') + ' 喊你拼单啦~ ' + goodsInfo.price + '元拼' + goodsInfo.goods_name + '，火爆抢购中......';
      imageUrl = 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg';
    }

    return appInstance.shareAppMessage({ 
      title: title,
      path: url,
      imageUrl: imageUrl,
      success: function (addTime) {
        // 转发获取积分
        appInstance.sendRequest({
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
    });
  },
  getGroupOrders: function (e) {
    this.setData({ isLeader: e.currentTarget.dataset.status });
    this.setData({ 'param.page': 1, 'param.current_status': 0, 'param.is_leader_order': e.currentTarget.dataset.status});
    this.setData({ status: 0, noMore: false });
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppGroupBuy/MyGroupBuy',
      data: _this.data.param,
      success: function (data) {
        //console.log(data);
        _this.setData({ list: data.data });
      }
    })
  },

  getGroupOrderByStatus: function (e) {
    this.setData({ 'param.page': 1, 'param.current_status': e.currentTarget.dataset.status });
    this.setData({ status: e.currentTarget.dataset.status });
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppGroupBuy/MyGroupBuy',
      data: _this.data.param,
      success: function (data) {
        //console.log(data);
        _this.setData({ list: data.data });
      }
    })
  },

  turnToDetail: function (e) {
    let id = e.currentTarget.dataset.orderid;
    let franchiseeId =  e.currentTarget.dataset.franchisee;
    let queryStr = franchiseeId === appInstance.getAppId() ? '' : '&franchisee='+franchiseeId;
    appInstance.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + id + queryStr);
  },

  getMore: function (e) {
    console.warn('more');
    if (e.target.dataset.page !== this.data.param.page) { return };
    if (this.data.noMore) { return };
    let _this = this;
    this.data.param.page = e.target.dataset.page + 1;
    appInstance.sendRequest({
      url: '/index.php?r=AppGroupBuy/MyGroupBuy',
      data: _this.data.param,
      success: function (data) {
        //console.log(data);
        if (data.is_more == 0) { _this.setData({ noMore: true }); }
        if (data.data.length != 0) {
          let list = _this.data.list.concat(data.data);
          _this.setData({ list: list });
          _this.setData({ 'param.page': _this.data.param.page });
        }
      }
    })
  },

  //确认收到退款
  retrieveMoney: function (e) {
    let _this = this;
    let franchiseeId =  e.currentTarget.dataset.franchisee;
    franchiseeId = franchiseeId === appInstance.getAppId() ? '' : franchiseeId;
    appInstance.sendRequest({
      url: '/index.php?r=AppShop/ComfirmRefund',
      data: {
        order_id: e.target.dataset.id,
        sub_shop_app_id: franchiseeId
      },
      success: function (data) {
        if (data.status === 0) {
          wx.showToast({
            title: '确认成功',
          });
          _this.onLoad();
        }
      }
    })
  },

  //再拼一次
  onceMore: function (e) {
    let id = e.currentTarget.dataset.id;
    let franchiseeId =  e.currentTarget.dataset.franchisee;
    let queryStr = franchiseeId === appInstance.getAppId() ? '' : '&franchisee='+franchiseeId;
    appInstance.turnToPage('/pages/groupGoodsDetail/groupGoodsDetail?detail=' + id + queryStr);
  },

  //支付
  pay: function (e) {
    let _this = this;
    let franchiseeId =  e.currentTarget.dataset.franchisee;
    franchiseeId = franchiseeId === appInstance.getAppId() ? '' : franchiseeId;
    let queryStr = franchiseeId ? '' : '&franchisee='+franchiseeId;
    appInstance.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: e.target.dataset.id,
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        var param = res.data,
          orderId = e.target.dataset.id;

        param.orderId = orderId;
        param.goodsType = e.target.dataset.type;
        param.success = function () {
          setTimeout(function () {
            appInstance.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + queryStr);
          }, 1500);
        };
        appInstance.wxPay(param);
      }
    })
  },

  goToOrderDetail: function () {
    appInstance.turnToPage('/eCommerce/pages/myOrder/myOrder');
  },

  cancelOrder: function (e) {
    let that = this;
    let franchiseeId =  e.currentTarget.dataset.franchisee;
    franchiseeId = franchiseeId === appInstance.getAppId() ? '' : franchiseeId;
    appInstance.showModal({
      content: '是否取消拼团？',
      showCancel: true,
      confirmText: '是',
      cancelText: '否',
      confirm: function () {
        appInstance.sendRequest({
          url: '/index.php?r=AppShop/CancelOrder',
          data: {
            order_id: e.target.dataset.id,
            sub_app_id: franchiseeId
          },
          success: function (res) {
            console.log(res);
            that.onLoad();
          }
        })
      }
    })
  }
})
