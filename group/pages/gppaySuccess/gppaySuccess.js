import Scratch from "../../../utils/scratch.js"
var app = getApp();
var utils = require('../../../utils/util.js');

Page({
  data: {
    page: 1,
    status: 0, // 0: 普通页面 1:有集集乐的情况
    orderId: '',
    modelId: '',
    franchiseeId: '',
    collectBenefitData: {}, // 集集乐数据 
    starData: [], //集集乐的星 light:已集样式 dark:未集样式
    isFail: true, //刮刮乐未中奖
    isWinning: true, //刮刮乐中奖
    isComfort: true, //刮刮乐安慰奖
    isWhole: true, //刮奖区域是否显示
    scratchId: '', //活动号
    isShowteam: false,
    winingTitle: '',
    isScroll: true, //刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
    ifWxCoupon: false,
    timestamp: '',
    signature: '',
    ifGetComfort: false,
    goodsData: {
      goods_list: [],
      is_more: 1,
      curpage: 1,
      loading: false,
      loadingFail: false
    },
    needNum: 0,
    formid: []
  },
  seckillFunc: [],
  isMore: 1,
  page: 1,
  onLoad: function(options) {
    let that = this;
    // 判断是否有集集乐活动
    if (options.collectBenefit == 1) {
      that.getCollectBenefitData(options.detail);
      that.setData({
        'status': 1
      });
    }
    that.setData({
      'team_token': options.teamToken,
      'orderId': options.detail,
      'franchiseeId': options.franchisee || '',
      'is_group': options.is_group || '',
      'code': options.code || '',
      'is_newAppointment': options.is_newAppointment || '',
    });
    that.getOrderDetail();
    this.loadMyTeams();
    this.getAppECStoreConfig();
    this.loadList();
    that.getGoldenData(options.detail);
    let systemInfo = app.globalData.systemInfo;
    let width = 558 * systemInfo.windowWidth / 750;
    let height = 258 * systemInfo.windowWidth / 750;
    that.scratch = new Scratch(that, {
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=https://chn.jisuapp.cn/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 15,
      callback: () => {
        that.setData({
          hideCanvas: true
        })
        //微信优惠券  主动跳转到领券页面
        if (that.data.ifWxCoupon) {
          setTimeout(function() {
            that.toAddCard()
          }, 500)
        }
      },
      imgLoadCallback: () => {
        setTimeout(function() {
          that.setData({
            isShowteam: true
          });
        }, 150);
      }
    });
  },
  onUnload: function () {
    if (this.downcount) {
      this.downcount.clear();
    }
  },
  onReachBottom: function() {
    if (this.isMore) {
      this.loadList();
    }
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
          coverObj = {},
          orderInfo = myTeams.order_info || '',
          goodsDetail = orderInfo.goods_info[0],
          originPrice = goodsDetail.virtual_price == '0.00' ? goodsDetail.original_price : goodsDetail.virtual_price,
          modelId = myTeams.model_id,
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
          originPrice: originPrice,
          myTeams: myTeams,
          modelId: modelId,
          goodsId: myTeams.goods_id,
          activityId: myTeams.activity_id,
          orderId: orderInfo.order_id,
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
  touchStart: function(e) {
    // this.scratch.start();
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchMove: function(e) {
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchEnd: function(e) {
    if (!this.isStart) return
    //自动清楚采用点范围值方式判断
    let {
      canvasWidth,
      canvasHeight,
      minX,
      minY,
      maxX,
      maxY
    } = this
    if (maxX - minX > .5 * canvasWidth && maxY - minY > .5 * canvasHeight) {
      this.ctx.draw()
      this.endCallBack && this.endCallBack()
      this.isStart = false
      this.page.setData({
        "isScroll": true
      })
    }
  },
  //砸金蛋
  getGoldenData: function(id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        order_id: id,
        sub_app_id: that.data.franchiseeId
      },
      success: function(data) {
        if (data.data) {
          if (that.data.code) {
            that.setData({
              isWhole: true,
            })
          } else {
            that.setData({
              isWhole: false,
              scratchId: data.data
            })
          }

        } else {
          that.setData({
            isWhole: true,
          })
        }
        if (data.integral) { //支付获取积分
          that.setData({
            'rewardPointObj': {
              showModal: true,
              count: data.integral,
              callback: ''
            }
          })
        }
      }
    })
  },
  showAreaClick: function() {
    //点击刮奖
    let that = this;
    that.setData({
      isShowteam: false
    })
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/lottery",
      hideLoading: true,
      data: {
        activity_id: that.data.scratchId,
        sub_app_id: that.data.franchiseeId
      },
      success: function(res) {
        let data = res.data;
        that.scratch.start();
        if (data.title == '谢谢参与') {
          that.setData({
            isFail: false
          })
        } else {
          let params = {
            ifWxCoupon: data.card_id || false,
            timestamp: data.timestamp || '',
            signature: data.signature || ''
          };
          if (data.is_comfort) {
            params['isComfort'] = false;
          } else {
            params['isWinning'] = false;
            params['winingTitle'] = data.title;
          }
          that.setData(params)
        }
      }
    })
  },
  onShareAppMessage: function(res) {
    var that = this,
      goods = that.data.goodsDetail,
      myTeams = this.data.myTeams,
      team_token = this.data.orderInfo.team_token,
      type = myTeams.activity_type,
      modelId = this.data.modelId,
      joined = myTeams.joined,
      franchiseeParam = this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '',
      share_path = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token + '&orderId=' + that.data.orderId,
      share_cover = myTeams.share_cover ? myTeams.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      nickname = app.getUserInfo('nickname'),
      title = myTeams.share_title ? myTeams.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + that.data.myTeams.group_buy_price + '元拼' + that.data.myTeams.goods_title + '，火爆抢购中......';

    return {
      // title: that.data.scratchInfo.title,
      path: share_path,
      title: title,
      imageUrl: share_cover,
      success: function(res) {
        // 转发成功
        app.sendRequest({
          url: "/index.php?r=appLotteryActivity/getTime",
          data: {
            activity_id: that.data.scratchId,
            type: 'share',
            sub_app_id: that.data.franchiseeId
          },
          success: function(res) {

          }
        })

      },
      fail: function(res) {
        // 转发失败
      },
    }
  },
  // 获取集集乐数据
  getCollectBenefitData: function(id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppMarketing/CollectmeSendCoupon',
      data: {
        'order_id': id,
        sub_app_id: that.data.franchiseeId
      },
      hideLoading: true,
      success: function(res) {
        let starData = [];
        for (var i = 0; i < res.data.star_num; i++) {
          starData.push('light');
        }
        for (var i = 0; i < res.data.collect_num - res.data.star_num; i++) {
          starData.push('dark');
        }
        that.setData({
          'collectBenefitData': res.data,
          'starData': starData
        });
      }
    });
  },
  showMyTeam: function() {
    var path = '/group/pages/gpmyOrder/gpmyOrder';
    this.saveUserFormId(function() {
      app.turnToPage(path, 1);
    })
  },
  openNewGroup: function() {
    let myTeams = this.data.myTeams;
    if (myTeams.enable_status == '0') {
      app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + myTeams.goods_id);
      return;
    }
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id;
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  goToHomepage: function() {
    let router = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + router + '/' + router
    });
  },
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid;
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl)
    })
  },
  goToOrderDetail: function() {
    let that = this;
    let groupPath = '/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let pagePath = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let appointmentPath = '/eCommerce/pages/appointmentOrderDetail/appointmentOrderDetail?detail=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let newAppointmentPath = '/newAppointment/pages/newAppointmentOrderDetail/newAppointmentOrderDetail?detail=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    that.saveUserFormId(function() {
      if (this.data.is_group == 'true') {
        app.turnToPage(groupPath, true);
      } else if (this.data.code) {
        app.turnToPage(appointmentPath, true);
      } else if (this.data.is_newAppointment) {
        app.turnToPage(newAppointmentPath, true);
      } else {
        app.turnToPage(pagePath, true);
      }
    })

  },
  goToGroupDetail: function() {
    var pageUrl = '/group/pages/gporderDetail/gporderDetail?from=paySuccess' + '&teamtoken=' + this.data.orderInfo.team_token;
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl);
    })
  },
  getOrderDetail: function() {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.data.orderId,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function(res) {
        _this.setData({
          orderInfo: res.data[0].form_data
        });
      }
    })
  },
  toAddCard: function() {

    let _data = this.data,
      wxcouponId = _data.ifWxCoupon,
      _this = this;

    wx.addCard({
      cardList: [{
        cardId: wxcouponId,
        cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
      }],
      success: function(res) {
        _this.setData({
          ifWxCoupon: false,
          ifGetComfort: true
        });
        app.sendRequest({
          url: '/index.php?r=appLotteryActivity/recvWeChatCoupon',
          data: {
            card_id: res.cardList[0].cardId,
            sub_app_id: _data.franchisee,
            activity_id: _data.scratchId,
          },
          success: function(res) {
            app.showModal({
              title: '提示',
              content: '领取卡券成功',
              showCancel: false
            });
          }
        });
      }
    })

  },
  turnToGoodsDetail: function() {
    var pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id;
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl)
    })
  },
  inviteFriends: function() {
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
      success: function(res) {
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

  getAppECStoreConfig: function() {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.data.franchiseeId);
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

  }
})