var app = getApp();
Page({
  data:{
    activityId:'',//活动号
    goldenData:{},//活动信息
    winnerList:[],//中奖名单
    exchangeMessage:{},//兑换次数信息
    isExchange:0,//是否关闭兑换次数弹窗
    isRecord:0,//是否关闭查看奖品弹窗
    eggsList:[
      {
        hasAnimate : false
      },
      {
        hasAnimate: false
      },
      {
        hasAnimate: false
      }
    ],
    comfort:0,//是否显示安慰奖弹窗
    prizeFail:0,//是否显示未中奖弹窗
    congratulation:0,//是否显示中奖弹窗
    eggNum:'',//砸蛋次数
    isdegree:0,//次数用尽不可分享
    duraMax:0,//次数用尽可分享
    isPlay: false,//音乐是否播放
    inputValue:'',//兑换次数
    myPrize:[],//我的奖品记录
    isSinker:false,
    isWin: false, //是否中奖
    animationData:{},//中奖名单动画
    animationData2:{},
    franchisee: '',
    ifWxCoupon:false,
    timestamp:'',
    signature:'',
    ifGetComfort:false,
    isShare:false
  },
  onLoad:function(options){
    let that=this,
        id=that.data.goldenData.id;
    let franchisee = options.franchisee || '';

    this.setData({
      franchisee: franchisee,
      shareKey: options.shareKey || ""
    });

    if (app.isLogin()) {
      that.getGoldenInfo()
      

    } else {
      app.goLogin({
        success: function () {
          that.getGoldenInfo()
         
        }
      });
    }
    this.animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'step-start'
    });
    this.animation2 = wx.createAnimation({
      duration: 0,
      timingFunction: 'step-start'
    });
    
  },
  onShow: function () {
    if (this.data.winnerList.length) {
        let winHeight = (this.data.winnerList.length) * 44;
        this.animationTop(winHeight, true);
    }
  },
  onUnload: function () {
    let that = this;
    clearTimeout(that.timeer);
    clearTimeout(that.timeer2);
    clearTimeout(that.timeer3);
    clearTimeout(that.timeer4);
  },
  //获取活动信息
  getGoldenInfo: function() {
    let that = this,
      dataObj = new Object();
    dataObj['category'] = 2;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getActivity",
      method: "post",
      data: dataObj,
      success: function(res) {
        let mes = res.data;
        mes.description = mes.description.replace(/\\n/g, '\n');
        that.setData({
          goldenData: mes,
          eggNum: mes.times
        })
        //改变页面标题
        wx.setNavigationBarTitle({
          title: mes.title
        });
        that.audioCtx = wx.createAudioContext('goldenAudio');
        if (mes.bgm != 0) {
          that.audioCtx.play();
        } else {
          that.audioCtx.pause();
        }
        that.getWinnerList(that.data.goldenData.id);
        if (that.data.shareKey) {
          that.getTimeByShareKey(that.data.goldenData.id, that.data.shareKey)
        }
        that.getShareKey(that.data.goldenData.id);
      }
    })
  },
  getShareKey: function(id) {
    var that = this,
      dataObj = new Object;
    dataObj['activity_id'] = id;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: '/index.php?r=appLotteryActivity/getShareKey',
      data: dataObj,
      success: function(res) {
        var data = res;
        if (data.status == 0) {
          that.setData({
            shareKey: data.data
          })
        }
      }
    })
  },
  getTimeByShareKey: function(id, shareKey) {
    var that = this,
      dataObj = new Object;
    dataObj['activity_id'] = id;
    dataObj['share_key'] = shareKey;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: '/index.php?r=appLotteryActivity/getTimeByShareKey',
      data: dataObj,
      success: function(res) {}
    })
  },
  //获取中奖名单
  getWinnerList:function(id){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/getWinnerList",
      method:"post",
      hideLoading:true,
      data:{
        activity_id:id,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        let winHeight = (res.count) * 44;
        that.setData({
          winnerList:res.data
        })
        that.animationTop(winHeight, true);
      }
    })
  },
  //兑换次数信息
  getMyIntegral: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getMyIntegralExchangeTimes",
      method: "post",
      data: {
        activity_id: that.data.goldenData.id,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        that.setData({
          exchangeMessage: res.data
        })
      }
    })
  },
  //打开兑换次数弹窗
  exchangePrizeClick:function(){
    let that=this;
    that.getMyIntegral();
    that.setData({
      isExchange:1
    })
  },
  //关闭兑换次数弹窗
  exchangeCancel:function(){
    this.setData({
      isExchange: 0
    })
  },
  //打开查看奖品弹窗
  recordClick:function(){
    let that=this;
    that.setData({
      isRecord:1
    })
    that.getMyPrize();
  },
  //关闭查看奖品弹窗
  recordWrapClick:function(){
    this.setData({
      isRecord: 0
    })
  },
  //阻止时间冒泡
  stopPropagation() {

  },
  //点击开始砸蛋
  startEgg:function(event){
    let that=this;
    let index = event.currentTarget.dataset.index;

    if (!that.data.goldenData.id){
      return;
    }
    if (that.eggsLoading) {
      return;
    }
    that.eggsLoading = true;

    if (that.data.eggNum <= 0) {
      if (that.data.goldenData.time_share == 0) {
        that.setData({
          isdegree: 1
        })
      } else {
        that.setData({
          duraMax: 1
        })
      }
      that.eggsLoading = false;
      return;
    }else{
    that.eggsClick(index);
    }
    that.setData({
      isSinker:true
    })
  },
  eggsLoading : false,
  //砸蛋获取数据
  eggsClick:function(index){
    let that=this;

    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/lottery",
      method:"post",
      hideLoading:true,
      data:{
        activity_id: that.data.goldenData.id,
        app_id: app.globalData.appId,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
      let data=res.data;
      let newdata = {};
      if(data.title=='谢谢参与'){

        newdata['isWin'] = false;
        setTimeout(function () {
          newdata = {};
          newdata['eggsList[' + index + '].hasAnimate'] = false;
          newdata['prizeFail'] = 1;
          that.setData(newdata);
          that.eggsLoading = false;
        }, 2200);
        
      }else{

        newdata['isWin'] = true;
        setTimeout(function () {
          newdata = {};
          if (data.is_comfort == 1) {
            newdata['comfort'] = 1;
          } else {
            newdata['congratulation'] = 1;
            newdata['prize_title'] = data.title;


          }
          //对中奖优惠券做判断 是否为微信优惠券
          let ifWxCoupon = data.card_id || false;
          newdata['ifWxCoupon'] = ifWxCoupon;
          newdata['timestamp'] = data.timestamp || '';
          newdata['signature'] = data.signature || '';

          newdata['eggsList[' + index + '].hasAnimate'] = false;
          that.setData(newdata);
          that.eggsLoading = false;
          //微信优惠券  主动跳转到领券页面
          if (ifWxCoupon) {
            that.toAddCard()
          }
        }, 2200)
        if (!that.data.ifWxCoupon) {
            that.getWinnerList(that.data.goldenData.id);
        }

      }
      newdata.eggNum = that.data.eggNum - 1;
      newdata['eggsList[' + index + '].hasAnimate'] = true;
      
      that.setData(newdata);
      },
      successStatusAbnormal : function(){
        that.eggsLoading = false;
      }
      
    })
  },
  //关闭未中奖弹窗
  notwinningClick:function(){
    this.setData({
      prizeFail:0
    })
  },
  //关闭中奖弹窗
  confirmClick:function(){
    this.setData({
      congratulation:0
    })
  },
  //关闭次数用尽弹窗
  duraClick:function(){
    this.setData({
      duraMax:0
    })
  },
  //关闭安慰奖弹窗
  comfortClick:function(){
    this.setData({
      comfort:0,
     ifGetComfort:false
    })
  },
  //关闭次数用尽不可分享给好友
  degreeClick:function(){
    this.setData({
      isdegree: 0
    })
  },
  // shareClick: function() {
  //   let that = this;
  //   app.sendRequest({
  //     url: "/index.php?r=appLotteryActivity/getTime",
  //     method: "post",
  //     data: {
  //       activity_id: that.data.goldenData.id,
  //       type: 'share',
  //       sub_app_id: that.data.franchisee
  //     },
  //     success: function(res) {
  //       console.log(res)
  //       that.setData({
  //         eggNum: res.data, //抽奖机会次数          
  //       })
  //     }
  //   })
  // },
  onShareAppMessage: function(res) {
    this.setData({
      isShare:true
    })
    var that = this;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    return {
      title: that.data.goldenData.title,
      path: '/awardManagement/pages/goldenEggs/goldenEggs?id=' + that.data.activityId + '&shareKey=' + that.data.shareKey + franchiseeParam,
      success: function(res) {
        if(that.data.ifWxCoupon){
            return
        }
        // 转发成功
        that.setData({
          prizeFail: 0,
          duraMax: 0,
          congratulation: 0
        })
      },
      fail: function (res) {
        // 转发失败
      },
      complete:function(){
        that.setData({
            isShare:false
        })
      }
    }
  },
  playMusics: function () {
    //播放和暂停切换
    if (this.data.goldenData.bgm){
      if (this.data.isPlay) {
        this.audioCtx.pause();
      } else {
        this.audioCtx.play();
      }
    }else{
      app.showToast({
        title: '活动未开始，没有音乐',
        icon: 'none'
      })
    }
  },
  audioPlay: function () {
    //监听播放
    this.setData({
      isPlay: true
    });
  },
  audioPause: function () {
    //监听暂停
    this.setData({
      isPlay: false
    });
  },
  bindReplaceInput: function (e) {
    //获取input框的值
    this.setData({
      inputValue: e.detail.value
    })
  },
  exchangeAll:function(){
    let that = this;
    that.setData({
      inputValue: that.data.exchangeMessage.exchange_times
    })
  },
  exchangeConfirm:function(){
    //点击确定兑换次数
    let that=this;
    if (that.data.goldenData.id){
      that.getIntegralTime();
    }
    
  },
  getIntegralTime:function(){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/getTime",
      method:"post",
      data:{
        activity_id: that.data.goldenData.id,
        type:"integral",
        times: that.data.inputValue,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        that.setData({
          eggNum:res.data,
          isExchange:0,
          inputValue:''
        })
      }
    })
  },
  //查看奖品弹窗
  getMyPrize:function(){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/getMyPrize",
      method:"post",
      data:{
        activity_id: that.data.goldenData.id,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        that.setData({
          myPrize:res.data
        })
      }
    })
  },
  animation: '',
  animation2: '',
  animationTop: function (h, isreset) {
    var that = this;

    clearTimeout(that.timeer);
    clearTimeout(that.timeer2);

    if (isreset) {
      that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
      that.animation2.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
      that.setData({
        animationData: that.animation.export(),
        animationData2: that.animation2.export()
      });
      setTimeout(function () {
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          animationData: that.animation.export()
        });
        that.animationTopCopy(h, isreset);
      }, 50)
    } else {
      that.timeer = setTimeout(function () {
        that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
        that.setData({
          animationData: that.animation.export()
        });
      }, 200 / (h + 200) * 15000);
      that.timeer2 = setTimeout(function () {
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          animationData: that.animation.export()
        })
        that.animationTopCopy(h);
      }, h / (h + 200) * 15000);
    }
  },
  animationTopCopy: function (h, isreset) {
    var that = this;

    clearTimeout(that.timeer3);
    clearTimeout(that.timeer4);

    if (!isreset) {
      that.timeer3 = setTimeout(function () {
        that.animation2.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
        that.setData({
          animationData2: that.animation2.export()
        });
      }, 200 / (h + 200) * 15000);
    }

    that.timeer4 = setTimeout(function () {
      that.animation2.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
      that.setData({
        animationData2: that.animation2.export()
      });
      that.animationTop(h);
    }, h / (h + 200) * 15000);
  },
  //领取微信优惠券
  toAddCard:function(){

    let _data = this.data,wxcouponId = _data.ifWxCoupon,_this = this;

    wx.addCard({
        cardList: [
            {
                cardId: wxcouponId,
                cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
            }
        ],
        success: function (res) {
            _this.setData({
                ifWxCoupon:false,
                ifGetComfort:true
            });
            app.sendRequest({
                url: '/index.php?r=appLotteryActivity/recvWeChatCoupon',
                data: {
                    card_id: res.cardList[0].cardId,
                    sub_app_id:_data.franchisee,
                    activity_id:_data.goldenData.id,
                    app_id:_data.goldenData.app_id
                },
                success: function (res) {
                    app.showModal({
                        title:'提示',
                        content: '领取卡券成功',
                        showCancel : false
                    });
                    _this.getWinnerList(_this.data.goldenData.id);
                }
            });
        }
    })

},
  //蒙层关闭中奖框
  shadeClose:function(){
    if(this.data.isShare){
      return
    }
    let _this = this, ifWxCoupon = _this.data.ifWxCoupon;
    if(ifWxCoupon){
        app.showModal({
            title:'提示',
            content:'微信优惠券不领取到卡包，下次就不能再领取了哦，确定放弃优惠么？',
            showCancel:true,
            confirm:function(res){
                _this.setData({
                    congratulation:0,
                    comfort:0,
                    ifWxCoupon:false,
                    ifGetComfort:false
                })
            }
        })
    }else {
        this.setData({
            congratulation:0,
            comfort:0,
            ifGetComfort:false
        })
    }

}
})
