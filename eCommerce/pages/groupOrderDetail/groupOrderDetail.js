var appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    more_members_arr: [],
    orderId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;

    _this.setData({
      orderId: options.id || '',
      franchisee: options.franchisee || ''
    })
    
    _this.getOrderInfo();
  },
  getOrderInfo: function(){
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppGroupBuy/GetGroupBuyOrderInfo',
      data: {
        order_id: _this.data.orderId,
        sub_app_id: _this.data.franchisee
      },
      success: function (res) {
        let data = res.data;
        let remark = data.form_data.remark;
        let more_members_arr = [];
        let max_user_num = Number(data.form_data.group_buy_order_info.max_user_num);
        let length = 0;
        if(max_user_num <= 5){
          length = max_user_num - data.form_data.group_buy_order_info.team_member_list.length;
          for (let i = 0; i < length; i++) {
            more_members_arr.push('');
          }
        }else {
          length = 3 - data.form_data.group_buy_order_info.team_member_list.length;
          for (let i = 0; i < length; i++) {
            more_members_arr.push('');
          }
        }
        data.form_data.remark = remark ? remark.replace(/\n|\\n/g, '\n') : remark;
        _this.setData({
          list: data,
          more_members_arr: more_members_arr
        });
      }
    })
  },
  onShareAppMessage: function (e) {
    let that = this,
        goodsInfo = this.data.list.form_data.goods_info[0],
        teamToken = this.data.list.form_data.team_token,
        id = e.from == 'button' ? e.target.dataset.detail : goodsInfo.goods_id,
        franchisee = this.data.franchisee,
        url = '/eCommerce/pages/joinGroupDetail/joinGroupDetail?detail=' + goodsInfo.goods_id + '&teamToken=' + teamToken + (franchisee ? '&franchisee=' + franchisee : '') + (appInstance.globalData.pageShareKey ? ('&pageShareKey=' + appInstance.globalData.pageShareKey) : ''),
        title = appInstance.getUserInfo('nickname') + ' 喊你拼单啦~ ' + goodsInfo.price + '元拼' + goodsInfo.goods_name + '，火爆抢购中......';

    return appInstance.shareAppMessage({ 
      title: title,
      path: url,
      imageUrl: 'https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
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
  //支付
  pay: function (e) {
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: e.target.dataset.id,
        sub_shop_app_id: _this.data.franchisee
      },
      success: function (res) {
        var param = res.data,
          orderId = e.target.dataset.id;

        param.orderId = orderId;
        param.goodsType = e.target.dataset.type;
        param.success = function () {
          setTimeout(function () {
            let franchiseeParam = _this.data.franchisee ? ('&franchisee=' + _this.data.franchisee) : '';
            appInstance.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + franchiseeParam);
          }, 1500);
        };
        appInstance.wxPay(param);
      }
    })
  },

  //确认收到退款
  retrieveMoney: function (e) {
    let _this = this;
    appInstance.sendRequest({
      url: '/index.php?r=AppShop/ComfirmRefund',
      data: {
        order_id: e.target.dataset.id,
        sub_shop_app_id: _this.data.franchisee
      },
      success: function (data) {
        if (data.status === 0) {
          wx.showToast({
            title: '确认成功',
          });
          _this.getOrderInfo();
          appInstance.globalData.myGroupRefresh = true;
        }
      }
    })
  },

  //再拼一次
  onceMore: function (e) {
    let id = e.currentTarget.dataset.id;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    appInstance.turnToPage('/pages/groupGoodsDetail/groupGoodsDetail?detail=' + id + franchiseeParam);
  },

  goToOrderDetail: function () {
    appInstance.turnToPage('/eCommerce/pages/myOrder/myOrder');
  }
})
