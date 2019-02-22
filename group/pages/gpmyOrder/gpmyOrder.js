// Collage/index/index.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    haveData: true,
    goodsList: [],
    isLeader: true,
    type: 0,
    formid: [],
    shareInfo: {
      group_price: '',
      share_cover: '',
      share_title: ''
    }
  },
  page: 1,
  isMore: 1,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.pageInit();
  },
  pageInit() {
    var _this = this;
    if (app.isLogin()) {
      _this.loadAll();
    } else {
      app.goLogin({
        success: function() {
          _this.loadAll();
        }
      });
    }
  },
  loadAll() {
    var _this = this;
    _this.loadMyTeams()
  },

  loadMyTeams() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/myTeams',
      data: {
        page: _this.page,
        status: _this.data.type,
        is_leader: _this.data.isLeader ? '1' : '0',
        page_size: 10
      },
      success: res => {
        if (_this.isMore === 0) {
          return;
        };
        var expired = '',
          nowdate = '',
          goodsList = _this.data.goodsList.concat(res.data);
        
        for (var index in goodsList) {
            goodsList[index].index = index,
              nowdate = res.current_time * 1000;
            expired = _this.countTime(goodsList[index].expired_time * 1000 - nowdate); 
            goodsList[index].expired = '(距结束约' + (expired[0] != '00' ? expired[0] + '天' : (expired[1] != '00' ? expired[1] + '小时' : (expired[2] != '00' ? expired[2] + '分' : (expired[3] != '00' ? '1分' : '')))) + ')';
          }
        _this.setData({
          goodsList: goodsList,
          haveData: goodsList.length > 0 ? true : false
        })
        _this.page++;
        _this.isMore = res.is_more;
      }
    })
  },
  goToGroupDetail(e) {
    var data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gporderDetail/gporderDetail?from=myOrder' + '&teamtoken=' + data.teamtoken;
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl);
    })
  },
  inviteFriends(e) {
    let that = this;
    let indexTeams = e.currentTarget.dataset.index;
    let myTeams = this.data.goodsList[indexTeams];
    let goodsInfo = myTeams.goods_info[0];
    let goods_id = myTeams.goods_id;
    let activity_id = myTeams.activity_id;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/GetGoodsShareInfo',
      data: {
        goods_id: goods_id,
        activity_id: activity_id,
      },
      success: function(res) {
        var data = {};
        data['shareInfo.group_price'] = res.data.price;
        data['shareInfo.share_cover'] = res.data.share_cover;
        data['shareInfo.share_title'] = res.data.share_title;
        that.setData(data)
        app.sendRequest({
          url: '/index.php?r=appGroupBuy/getShareQRCode',
          data: {
            goods_id: goods_id,
            activity_id: activity_id,
            type: 6,
            text: goodsInfo.goods_name,
            price: goodsInfo.price,
            virtual_price: goodsInfo.virtual_price == '0.00' ? goodsInfo.original_price : goodsInfo.virtual_price,
            goods_img: goodsInfo.cover,
            sub_shop_id: that.data.franchiseeId,
            user_token: app.globalData.PromotionUserToken || ''
          },
          success: function(res) {
            animation.bottom("0").step();
            that.setData({
              "pageQRCodeData.shareDialogShow": 0,
              "pageQRCodeData.shareMenuShow": true,
              "pageQRCodeData.goodsInfo": res.data,
              "pageQRCodeData.animation": animation.export(),
              goodsShareData: myTeams
            })
          }
        })
      }
    })
  },
  // 事件绑定
  changeIdentity(e) {
    var data = e.currentTarget.dataset;
    this.setData({
      isLeader: data.isleader == 'true' ? true : false,
      type: 0,
      goodsList: []
    })
    this.page = 1;
    this.isMore = 1;
    this.loadMyTeams();
  },
  changeType(e) {
    var data = e.currentTarget.dataset;
    this.setData({
      type: data.type,
      goodsList: []
    })
    this.page = 1;
    this.isMore = 1;
    this.loadMyTeams();
  },
  openNewGroup(e) {
    var data = e.currentTarget.dataset;
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid;
    if (data.status == 3 && data.type == 4 || data.groupbuy == 0) {
      app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + data.goodsid)
      return;
    }
    if (data.status == '5') {
      app.showModal({
        content: '该拼团活动已结束'
      })
      return;
    }
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  gotoGoodsOrder(e) {
    var pathUrl = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + e.currentTarget.dataset.orderid;
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        form_id: _this.data.formid || []
      },
      complete: function() {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })

  },
  countTime: function(difference) {
    if (difference < 0) {
      return ['00', '00', '00'];
    }

    let _second = 1000,
      _minute = _second * 60,
      _hour = _minute * 60,
      _date = _hour * 24,
      time = [];

    let dates = Math.floor(difference / _date),
      hours = Math.floor((difference % _date) / _hour),
      minutes = Math.floor((difference % _hour) / _minute),
      seconds = Math.floor((difference % _minute) / _second);

    dates = (String(dates).length >= 2) ? dates : '0' + dates;
    hours = (String(hours).length >= 2) ? hours : '0' + hours;
    minutes = (String(minutes).length >= 2) ? minutes : '0' + minutes;
    seconds = (String(seconds).length >= 2) ? seconds : '0' + seconds;
    time[0] = dates;
    time[1] = hours;
    time[2] = minutes;
    time[3] = seconds;

    return time;
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (this.isMore) {
      this.loadAll();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(e) {
    var that = this,
      myTeams = this.data.goodsShareData,
      goodsInfo = myTeams.goods_info[0],
      shareInfo = this.data.shareInfo,
      team_token = myTeams.team_token,
      type = myTeams.activity_type,
      urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      url = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token,
      nickname = app.getUserInfo('nickname'),
      share_cover = shareInfo.share_cover ? shareInfo.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      title = shareInfo.share_title ? shareInfo.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + shareInfo.group_price + '元拼' + goodsInfo.goods_name + '，火爆抢购中......';

    return app.shareAppMessage({
      title: title,
      path: url,
      imageUrl: share_cover,
      success: function(addTime) {
        app.showToast({
          title: '转发成功',
          duration: 500
        });
        // 转发获取积分
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=appShop/getIntegralLog',
          data: {
            add_time: addTime
          },
          success: function(res) {
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
  }
})