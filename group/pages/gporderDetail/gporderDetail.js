// Collage/index/index.js
var app = getApp();
var utils = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    myTeams: {},
    formid: [],
    coverList: [],
    goodsData: {
      goods_list: [],
      is_more: 1,
      curpage: 1,
      loading: false,
      loadingFail: false
    },
    orderId: '',
    status: 4,
    teamToken: '',
    needNum: 0,
    progress: 0,
    modelId: 0
  },
  seckillFunc: [], isMore: 1,
  page: 1,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      team_token: options.teamtoken
    })
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
    _this.loadMyTeams();
    _this.loadList();
    this.setData({
      appName: app.globalData.appTitle,
      appLogo: app.globalData.appLogo
    })
  },
  loadMyTeams() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/teamInfo',
      data: {
        team_token: _this.data.team_token
      },
      success: res => {
        var coverList = [],
          myTeams = res.data,
          modelId = myTeams.model_id || '',
          coverObj= {},
          orderInfo = myTeams.order_info || '',
          goodsDetail = orderInfo.goods_info[0],
          orderId = orderInfo.order_id,
          progress = parseInt(Number(res.data.current_user_count / res.data.max_user_num) * 100),
          maxNum = Number(myTeams.max_user_num) || 0,
          needNum = (maxNum - myTeams.current_user_count) || '',
          originPrice = myTeams.virtual_price == '0.00' ? myTeams.goods_price : myTeams.virtual_price;
 
        myTeams.downCount = {
          hours: '00',
          minutes: '00',
          seconds: '00'
        };
        if (myTeams.member) {
          var coverTotalArr = myTeams.member || '',
            coverArr = [],
            numLack = myTeams.activity_type == 3 ? ((maxNum - coverTotalArr.length) + 1) : (maxNum - coverTotalArr.length),
            numLen = 0,
            coverLoading = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/loading-portrait.png'
            },
            coverUser = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/missing-head.png'
            },
            coverSuccess = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/success-loading.png'
            };
          for (let arrIndex in coverTotalArr) {
            coverObj = {
              isNum: 1,
              image: coverTotalArr[arrIndex]
            }
            coverArr.push(coverObj)
          }
          if (maxNum > 5) {
            switch (coverArr.length) {
              case 1:
                numLen = 2;
                break;
              case 2:
                numLen = 1;
                break;
              case 3:
                numLen = 0;
                break;
            }
            if (coverArr.length < 3) { //显示3个用户+1个等待+1个用户
              coverList = coverArr;
              for (var i = 0; i < numLen; i++) {
                coverList.push(coverUser);
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 3 && coverArr.length < 5) {
              for (var index in coverArr) {
                if (index < 3) {
                  coverList.push(coverArr[index]);
                }
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 5) {
              if (coverArr.length < maxNum) {
                for (var index in coverArr) {
                  if (index < 3) {
                    coverList.push(coverArr[index]);
                  }
                }
                coverList.push(coverLoading);
                coverList.push(coverUser);
              } else {
                for (var index in coverArr) {
                  if (index < 4) {
                    coverList.push(coverArr[index])
                  }
                }
                coverList.push(coverSuccess);
              }


            }
          } else {
            coverList = coverArr;
            for (let i = 0; i < numLack; i++) {
              coverList.push(coverUser);
            }
          }

        }
        myTeams.server_time = res.current_time;
        myTeams.seckill_end_time = utils.formatTime(new Date(myTeams.expired_time * 1000));
        if (myTeams.current_status == 0 || myTeams.current_status == 1) {
          _this.downcount = _this.beforeGroupDownCount(myTeams, _this, 'myTeams');
        } else if (myTeams.current_status == 2) {
          _this.downcount = _this.duringGroupDownCount(myTeams, _this, 'myTeams');
        }
        _this.setData({
          progress: progress,
          myTeams: myTeams,
          modelId: modelId,
          orderId: orderId,
          originPrice: originPrice,
          goodsId: myTeams.goods_id,
          activityId: myTeams.activity_id,
          team_token: orderInfo.team_token,
          member: coverList,
          orderInfo: orderInfo,
          goodsDetail: orderInfo.goods_info[0],
          needNum: needNum
        })
      }
    })
  },
  beforeGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_start_time,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 3;
        newData[path + '.current_status'] = 3;
        newData[path + '.server_time'] = formData.seckill_start_time;
        page.setData(newData);
        formData.server_time = formData.seckill_start_time;
        _this.downcount = _this.duringGroupDownCount(formData, page, path);
      }
    }, page, path + '.downCount');

    return downcount;
  },
  duringGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_end_time,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 4;
        newData[path + '.current_status'] = 4;
        page.setData(newData);
        if (path == "myTeams") {
          page.loadMyTeams();
        }
      }
    }, page, path + '.downCount');

    return downcount;
  },
  loadList() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      data: {
        page: _this.page,
        page_size: 4,
        status: 1,
        sub_app_id: _this.data.franchisee
      },
      success: res => {
        let rdata = res.data,
          newdata = {},
          compid = 'goodsData',
          goodsList = this.data.goodsData.goods_list,
          length = goodsList.length,
          downcountArr = _this.downcountArr || [];

        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i];
          f.description = '';
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
        }
        var dataArr = res.data;
        newdata[compid + '.goods_list'] = goodsList.concat(dataArr);
        newdata[compid + '.is_more'] = res.is_more;
        newdata[compid + '.curpage'] = 1;
        newdata[compid + '.loading'] = false;
        newdata[compid + '.loadingFail'] = false;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.page++;
        _this.isMore = res.is_more;
      }
    })
  },

  // 点击事件
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid;
    this.saveUserFormId(function(){
      app.turnToPage(pageUrl)
    })
  },
  copyOrderId() {
    let _this = this;
    wx.setClipboardData({
      data: _this.data.team_token,
      success: function(res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  openNewGroup: function() {
    let myTeams = this.data.myTeams;
    if (myTeams.enable_status == '0'){
      app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + myTeams.goods_id);
      return;
    }
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id;
    this.saveUserFormId(function(){
      app.turnToPage(pathUrl)
    })
  },
  showMyTeamList() {
    this.saveUserFormId(function(){
      app.turnToPage('/group/pages/gpmyOrder/gpmyOrder');
    })
  },
  inviteFriends: function () {
    let that = this;
    let myTeams = this.data.myTeams;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getShareQRCode',
      data: {
        goods_id: myTeams.goods_id,
        activity_id: myTeams.activity_id,
        type: 6,
        text: myTeams.goods_title,
        price: myTeams.group_buy_price,
        virtual_price: that.data.originPrice,
        goods_img: myTeams.img_urls ? myTeams.img_urls[0] : myTeams.goods_cover,
        sub_shop_id: that.data.franchiseeId,
        user_token: app.globalData.PromotionUserToken || ''
      },
      success: function (res) {
        animation.bottom("0").step(); 
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
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
      complete: function () {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })

  },
  gotoOrderDetail(){
    var pageUrl = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + this.data.orderId
    app.turnToPage(pageUrl)
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
  onUnload: function () {
    if (this.downcount) {
      this.downcount.clear();
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.isMore) {
      this.loadList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    var that = this,
      team_token = this.data.team_token,
      myTeams = this.data.myTeams, 
      type = myTeams.activity_type,
      modelId = this.data.modelId,
      urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      url = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token + '&orderId=' + that.data.orderId,
      nickname = app.getUserInfo('nickname'),
      share_cover = myTeams.share_cover ? myTeams.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      title = myTeams.share_title ? myTeams.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + that.data.myTeams.group_buy_price + '元拼' + that.data.myTeams.goods_title + '，火爆抢购中......';

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