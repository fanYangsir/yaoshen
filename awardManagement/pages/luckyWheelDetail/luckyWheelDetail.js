
var app = getApp()
Page({
  data:{
    activityId:'',
    activityData:{},   //
    winnerList:[],    //中奖名单
    recordSick:0 ,   //我的奖品弹窗是否显示
    animationData:{},    //圆盘动画
    awardsList: {}, //奖项列表
    opportunities:'', //抽奖机会次数
    text: "Page animation",
    congratulation:0,//中奖弹窗是否显示
    prizeTitle:'',//奖品名称
    prizeFail:0,  //未中奖弹窗是否显示
    colorAwardDefault: '#FE7F3A',//奖品默认颜色  
    colorAwardSelect: 'rgba(255,113,0,.5)',//奖品选中颜色  
    indexSelect: '',//被选中的奖品index  
    isRunning: false,//是否正在抽奖  
    runDegs : 0 ,
    duraMax:0,//抽奖次数弹窗是否显示
    comfort:0,//安慰奖弹窗
    // src:"http://cdn.jisuapp.cn/static/webapp/audio/gameStart.mp3",
    isPlay : false,
    isExchange:0,//兑换次数弹窗
    exchangeMessage:{},  //兑换次数数据
    chanageMes:'',
    inputValue:'',
    isdegree:0 , //次数用尽不可分享好有弹窗
    RecordSickArr:[],
    winListData:{},
    winListData2:{},
    franchisee: '',
    ifWxCoupon:false,
    timestamp:'',
    signature:'',
    ifGetComfort:false,
    isShare:false
  },
  onLoad:function(options){
    let that=this;
    let id = that.data.activityData.id;
    let franchisee = options.franchisee || '';

    this.setData({
      franchisee: franchisee,
      shareKey: options.shareKey || ""
    });
    if (app.isLogin()){
      that.dataInitial()
  
    }else{
      app.goLogin({
        success: function () {
          that.dataInitial()
          
        }
      });
    }
    this.animation = wx.createAnimation({
      duration:0,
      timingFunction:'step-start'
    });
    this.animation2 = wx.createAnimation({
      duration:0,
      timingFunction:'step-start'
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
  getWinnerList:function(id){
    var that=this;
    //获取中奖名单
   app.sendRequest({
     url:"/index.php?r=appLotteryActivity/getWinnerList",
     method:"post",
     data:{
       activity_id:id,
       sub_app_id: that.data.franchisee
     },
     success:function(res){
       let winHeight = (res.count) * 44;
      that.setData({
        winnerList:res.data
      })
      that.animationTop(winHeight,true);
     }
   })
  },
  animation:'',
  animation2:'',
  animationTop: function (h, isreset) {
    var that = this;

    clearTimeout(that.timeer);
    clearTimeout(that.timeer2);

    if (isreset) {
      that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
      that.animation2.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
      that.setData({
        winListData: that.animation.export(),
        winListData2: that.animation2.export()
      });
      setTimeout(function () {
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          winListData: that.animation.export()
        });
        that.animationTopCopy(h, isreset);
      }, 50)
    } else {
      that.timeer = setTimeout(function () {
        that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
        that.setData({
          winListData: that.animation.export()
        });
      }, 200 / (h + 200) * 15000);
      that.timeer2 = setTimeout(function () {
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          winListData: that.animation.export()
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
          winListData2: that.animation2.export()
        });
      }, 200 / (h + 200) * 15000);
    }

    that.timeer4 = setTimeout(function () {
      that.animation2.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
      that.setData({
        winListData2: that.animation2.export()
      });
      that.animationTop(h);
    }, h / (h + 200) * 15000);
  },
  clickpagePrize:function(){
    //点击我的奖品
    let that=this;
    that.setData({recordSick:1 })
    that.getMyPrize();
  },
  clickRecordSick:function(e){
     this.setData({recordSick: 0 })
  },
  stopPropagation(){

  },
  confirmClick:function(){
    //关闭中奖弹窗
    this.setData({ congratulation: 0})
  },
  dataInitial:function(){
    // 初始化大转盘信息
    var that = this,
      dataObj = new Object();
    dataObj['category'] = 0;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getActivity",
      method: "post",
      data: dataObj,
      success: function(res) {
        var mes = res.data
        that.audioCtx = wx.createAudioContext('luckyAudio');
        if(mes.bgm!=0){
          that.audioCtx.play();
        }else{
          that.audioCtx.pause();
        }
        mes.description = mes.description.replace(/\\n/g , '\n');
        that.setData({
          'activityData': mes,
          opportunities: mes.times
        })
        //改变页面标题
        wx.setNavigationBarTitle({
          title: res.data.title
        });
        that.getWinnerList(that.data.activityData.id);
        if (that.data.shareKey) {
          that.getTimeByShareKey(that.data.activityData.id, that.data.shareKey)
        }
        that.getShareKey(that.data.activityData.id);

      }
    })
  },
  //圆盘抽奖
  getLottery: function (winId) {
    let  that = this;
    // 获取奖品配置
    let awardsConfig = that.data.activityData.turntable;
    let runNum = 8;
    let awardIndex = 0;
    if (winId.turntable_id == -1){
      awardIndex = that.getNotWinIndex();
    }else{
      awardIndex = that.drawClick(winId.turntable_id);
    }

    // 旋转抽奖
    let runDegs = that.data.runDegs ;
    console.log('deg', runDegs)
    runDegs = (runDegs - runDegs % 360) + (360 * runNum - awardIndex * (360 / 8) - 22.5);
    console.log('deg', runDegs)

    var animationRun = wx.createAnimation({
      duration: 4000,
      timingFunction: 'ease'
    })
    that.animationRun = animationRun
    animationRun.rotate(runDegs).step()
    that.setData({
      animationData: animationRun.export(),
      opportunities: that.data.opportunities - 1 ,
      runDegs: runDegs
    })
    // 中奖提示
    setTimeout(function () {
      
      let title = awardsConfig[awardIndex].prize_title;
      if (winId.is_comfort==1){
        that.setData({
          comfort: 1,
          isRunning: false,
          ifWxCoupon:winId.card_id || false,
          timestamp:winId.timestamp || '',
          signature:winId.signature || ''
        })
        //微信优惠券  主动跳转到领券页面
        if(winId.card_id){
            that.toAddCard()
        }else {
            that.getWinnerList(that.data.activityData.id);
        }
      }else{
        if (title == "谢谢参与") {
          that.setData({
            prizeFail: 1,
            isRunning: false
          })
        } else {

          that.setData({
            congratulation: 1,
            prize_title: title,
            isRunning: false,
            ifWxCoupon:winId.card_id || false,
            timestamp:winId.timestamp || '',
            signature:winId.signature || ''
          })
          //微信优惠券  主动跳转到领券页面
          if(winId.card_id){
             that.toAddCard()
          }else {
              that.getWinnerList(that.data.activityData.id);
          }
        }
      }
      
    }, 5000);
    
  },
  notwinningClick:function(){
    //关闭未中奖弹窗
    this.setData({
      prizeFail:0
    })
  },
  tipClick:function(){
    //抽奖之后请求后台接口
    let that = this;
    if (!that.data.activityData.id){
      return;
    }
    if (that.data.opportunities <=0) {
      if (that.data.activityData.time_share==0){
        that.setData({
          isdegree:1
        })
      }else{
        that.setData({
          duraMax: 1
        })
      }
      
      return;
    }
    if (that.data.isRunning){
      return ;
    }
    
    that.setData({
      isRunning : true
    });

    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/lottery",
      method: "post",
      data: {
        activity_id: that.data.activityData.id,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        
        
        if (that.data.activityData.category == 0){
          that.getLottery(res.data);
        }else{
          that.startGame(res.data);
        }
      },
      successStatusAbnormal : function(){
        that.setData({
          isRunning: false
        });
      }
    })
  },
  //方盘抽奖
  startGame: function (winId) {
    var _this = this;
    var indexSelect = _this.data.indexSelect;
    var i = 0;
    let awardIndex = 0;
    if (winId.turntable_id == -1){
      awardIndex = _this.getNotWinIndex();
    }else{
      awardIndex = _this.drawClick(winId.turntable_id);
    }
    var num = awardIndex + 24 - indexSelect;
    _this.setData({
      opportunities: _this.data.opportunities - 1,
    })
    var timer = setInterval(function () {
      indexSelect++;
      
      i += 1;
      if (i > num) {
        //去除循环  
        clearInterval(timer)
        //获奖提示  
        if (winId.is_comfort==1){
          _this.setData({
                comfort: 1,
                isRunning: false,
                ifWxCoupon:winId.card_id || false,
                timestamp:winId.timestamp || '',
                signature:winId.signature || ''
            })
            //微信优惠券  主动跳转到领券页面
            if(winId.card_id){
              _this.toAddCard()
            }else {
              _this.getWinnerList(_this.data.activityData.id);
            }
        }else{
          if (_this.data.activityData.turntable[_this.data.indexSelect].prize_title == '谢谢参与') {
            _this.setData({
              prizeFail: 1,
              isRunning: false
            })
          } else {
              //对中奖优惠券做判断 是否为微信优惠券
              let ifWxCoupon = winId.card_id || false;

            _this.setData({
              congratulation: 1,
              prize_title: _this.data.activityData.turntable[_this.data.indexSelect].prize_title,
              isRunning: false,
              ifWxCoupon:ifWxCoupon,
              timestamp:winId.timestamp || '',
              signature:winId.signature || ''
            })
            //微信优惠券  主动跳转到领券页面
            if(ifWxCoupon){
              _this.toAddCard()
            }else {
              _this.getWinnerList(_this.data.activityData.id);
            }

          }
        }
        
        return ;
      }
      indexSelect = indexSelect % 8;
      _this.setData({
        indexSelect: indexSelect
      })
    }, 100)
    
  },
  drawClick : function(winId){
    let that = this,
        list = that.data.activityData.turntable,
        idx = 0;

    for(let i = 0 ; i < list.length ; i++){
      if (list[i].id == winId){
        idx = i;
      }
    }

    return idx;
  },
  getNotWinIndex: function(){
    let that = this,
      list = that.data.activityData.turntable,
      idx = 0;

    for (let i = 0; i < list.length; i++) {
      if (list[i].coupon_id == -1) {
        idx = i;
      }
    }

    return idx;
  },
  // shareClick: function () {
  //   let that = this;
  //   app.sendRequest({
  //     url: "/index.php?r=appLotteryActivity/getTime",
  //     method: "post",
  //     data: {
  //       activity_id: that.data.activityData.id,
  //       type: 'share',
  //       sub_app_id: that.data.franchisee
  //     },
  //     success: function (res) {
  //       console.log(res)
  //       that.setData({
  //         opportunities: res.data, //抽奖机会次数          
  //       })
  //     }
  //   })

  // },
  playMusics: function() {
    //播放和暂停切换
    if (this.data.activityData.bgm){
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
  audioPlay : function(){
    //监听播放
    this.setData({
      isPlay : true
    });
  },
  audioPause: function () {
    //监听暂停
    this.setData({
      isPlay: false
    });
  },
  onShareAppMessage: function (res) {
    this.setData({
        isShare : true
    })
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    var that=this;
    return {
      title: that.data.activityData.title,
      path: '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail?id=' + this.data.activityId + '&shareKey=' + that.data.shareKey + franchiseeParam,
      success: function(res) {
        if(that.data.ifWxCoupon){
          return
        }
        // 转发成功
        that.setData({
          prizeFail:0,
          duraMax:0,
          congratulation:0
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
  //
  sureClick:function(){
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
  //关闭兑换次数弹窗
  exchangeCancel:function(){
   this.setData({
     isExchange:0
   })
  },
  //点击积分兑换按钮
  exchangePrize:function(){
    let that=this;
   that.setData({
     isExchange: 1
   })
   that.getMyIntegral()
  },
  //兑换次数信息
  getMyIntegral:function(){
    let that=this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getMyIntegralExchangeTimes",
      method: "post",
      data: {
        activity_id: that.data.activityData.id,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
       that.setData({
         exchangeMessage:res.data
       })
      }
    })
  },
  degreeClick:function(){
   //关闭次数用尽不可分享好友
   this.setData({
     isdegree:0
   })
  },
  //全部替换
  exchangeAll:function(){
    let that=this;
   that.setData({
     inputValue: that.data.exchangeMessage.exchange_times
   })
  },
  //获取input框的value值
  bindReplaceInput:function(e){
   this.setData({
     inputValue:e.detail.value
   })
  },
  //点击确定兑换次数
  exchangeConfirm:function(){
   let that=this;
   that.getTime()
  },
 //点击积分兑换获取次数
  getTime:function(){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/getTime",
      method:"post",
      data:{
        activity_id: that.data.activityData.id,
        type:"integral",
        times: that.data.inputValue,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
       that.setData({
         opportunities: res.data, //抽奖机会次数 
         isExchange:0 ,
         inputValue:''                 
       })
      }
    })
  },
  //查看奖品
  getMyPrize:function(){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/getMyPrize",
      method:"post",
      data:{
        activity_id: that.data.activityData.id,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        that.setData({
          RecordSickArr:res.data
        })
      }
    })
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
                      activity_id:_data.activityData.id,
                      app_id:_data.activityData.app_id
                  },
                  success: function (res) {
                      app.showModal({
                          title:'提示',
                          content: '领取卡券成功',
                          showCancel : false
                      });
                      _this.getWinnerList(_this.data.activityData.id);

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