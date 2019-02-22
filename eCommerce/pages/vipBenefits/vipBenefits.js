
let app = getApp()

Page({
  data: {
    slideData: [],                   // 存的是会员卡的logo
    currentIndex: 0,
    startX: 0,
    moveX: 0,
    cardListData: [],                // 会员卡列表信息
    currentCard: {},                 // 当前会员卡信息
    requesting: false,
    currentComboIndex: 0,            // 当前选中的优惠套餐的下标
    price: 0,                        // 价格
    cardId: '',                      // 会员卡id
    isPaidCard: '',                  // 是否为付费会员卡
    isRenew: '',                     // 是否为续费会员
    isNeedCollect: 0,                // 是否需要收集会员信息
    userPaidVipCard: {},             // 用户付费卡
    userVipCard: {},                 // 用户的规则卡
    specialNote: '',                 // 特别说明
    isVipBenefitDay: 0,              // 是否存在会员日
    isUserDiyLogo: false,            // 是否为用户自定义logo      
    loading: true,                  // 首屏是否在加载  
    franchiseeId: ''                 // 子店id
  },
  onLoad: function (options) {
    let id = options.id || '';
    let isPaidCard = options.is_paid_card || '';
    let isRenew = options.is_renew || '';
    let franchiseeId = options.franchisee || '';

    this.setData({
      cardId: id,
      isPaidCard: isPaidCard,
      isRenew: isRenew,
      franchiseeId: franchiseeId
    })
    this.getAllVipCardInfo();
    this.getCollectUserinfoConfig();
  },
  touchStart: function (e) {
    let startX = e.changedTouches[0].clientX;

    this.setData({
      startX: startX
    })
  },
  touchMove: function (e) {
    let endX = e.changedTouches[0].clientX;
    let moveX = endX - this.data.startX;               // moveX：右移为负数，左移为正数，
    let currentIndex = this.data.currentIndex;
    let len = this.data.slideData.length;

    if ((currentIndex <= 1 && moveX >= 0) || (currentIndex >= len - 2 && moveX <= 0)) {
      return;
    }
    this.setData({
      moveX: moveX
    })
    if (Math.abs(moveX) >= 250) {
      this.setData({
        startX: this.data.startX + moveX,
        moveX: 0
      })
      if (moveX > 0 && this.data.currentIndex > 0) {
        this.setData({
          startX: this.data.startX + moveX,
          currentIndex: this.data.currentIndex - 1,
          moveX: 0
        })
      } else if (moveX <= 0 && this.data.currentIndex < len) {
        this.setData({
          startX: this.data.startX + moveX,
          currentIndex: this.data.currentIndex + 1,
          moveX: 0
        })
      }
    }
    this.setCurrentCard();
  },
  touchEnd: function (e) {
    let endX = e.changedTouches[0].clientX;
    let moveX = endX - this.data.startX;
    let currentIndex = this.data.currentIndex;
    let len = this.data.slideData.length;

    if ((currentIndex < 1 && moveX > 0) ||
      // (currentIndex <= 1 && moveX === 0 && endX < 125) ||
      (currentIndex > len - 2 && moveX < 0) // ||
      // (currentIndex >= len - 2 && moveX === 0 && endX > 250)
    ) {
      return;
    }
    this.setData({
      moveX: moveX
    })
    if (moveX === 0) {
      if (endX > 250 || endX < 125) {
        this.setData({
          currentIndex: endX > 250 ? this.data.currentIndex + 1 : endX < 125 ? this.data.currentIndex - 1 : '',
          moveX: 0
        })
      }
    } else {
      this.setData({
        currentIndex: moveX > 0 ? this.data.currentIndex - 1 : this.data.currentIndex + 1,
        moveX: 0
      })
    }
    this.setCurrentCard();
  },
  getAllVipCardInfo: function () {
    let _this = this;

    app.sendRequest({
      url: '/index.php?r=appVipCard/getUserAccountSurvey',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchiseeId
      },
      hideLoading: false,
      success: function (res) {
        let data = res.data.all_vip_card;
        let slideData = [];
        let isPaidCard = _this.data.isPaidCard;
        let cardId = _this.data.cardId;
        let cardListData = [];
        let userPaidVipCard = res.data.user_paid_vip_card ? res.data.user_paid_vip_card : {};
        let userVipCard = res.data.user_vip_card ? res.data.user_vip_card : {};

        data.map((item) => {
          if (item.condition_type == 0 && (!isPaidCard || cardId)) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo);
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          } else if (item.condition_type == 1 && (!isPaidCard || cardId)) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo)
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          } else if (item.condition_type == 2) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo)
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          }
        })
        slideData.forEach((item, index) => {
          if (item.indexOf('/vip-card/') !== -1) {             // 如果为自定义logo则不在logo上显示卡名称
            cardListData[index].is_show_title = 1;
          } else {
            cardListData[index].is_show_title = 0;
          }
        })
        _this.setData({
          cardListData: cardListData,
          slideData: slideData,
          userPaidVipCard: userPaidVipCard,
          userVipCard: userVipCard,
          isVipBenefitDay: res.data.is_vip_benefit_day
        })
        if (_this.data.cardId) {
          _this.setCurrentIndex(_this.data.cardId)
        }
        _this.setCurrentCard();
      },
      complete: function(res){
        _this.setData({
          loading: false
        })
      }
    })
  },
  setCurrentIndex: function (id) {
    let allCardData = this.data.cardListData;
    let currentIndex = 0;

    allCardData.forEach((item, index) => {
      if (this.data.isPaidCard == 1 || this.data.isRenew == 1) {
        if (item.condition_type == 2 && item.id == id) {
          currentIndex = index
        }
      } else {
        if ((item.condition_type == 0 || item.condition_type == 1) && item.id == id) {
          currentIndex = index
        }
      }
    })

    this.setData({
      currentIndex: currentIndex
    })

  },
  // 设置当前会员卡的信息
  setCurrentCard: function () {
    let info = this.data.cardListData[this.data.currentIndex];
    let price = 0;
    let specialNoteArr = [];
    let isUserDiyLogo = false;

    if(!info){
      return;
    }
    if (info.condition_type == 0) {                   // condition_text：获取条件的文字说明
      info.condition_text = ['无门槛'];
    } else if (info.condition_type == 1) {
      info.condition_text = [];
      if (info.trade_count !== '-1') {
        info.condition_text.push(`累计交易成功${info.trade_count}笔`);
      }
      if (info.consume_count !== '-1') {
        let text = '';
        if (info.condition_text.length) {
          text += '或'
        }
        text += `累计消费金额${info.consume_count}元`;
        info.condition_text.push(text);
      }
      if (info.integral_count !== '-1') {
        let text = '';
        if (info.condition_text.length) {
          text += '或'
        }
        text += `累计积分达到${info.integral_count}分`;
        info.condition_text.push(text);
      }
    } else if (info.condition_type == 2) {
      info.condition_text = ['付费购买']
    }
    if (info.combo && !Array.isArray(info.combo)) {   // combo：优惠套餐 
      info.combo = JSON.parse(info.combo);
    }
    if (info.combo) {
      info.combo = info.combo.map((item) => {
        if (item.price) {
          item.price = Number(item.price).toFixed(2)
        }

        return item;
      })
    }
    if (info.price) {
      price = info.price;
    }
    if (info.coupon_list && Array.isArray(info.coupon_list) && info.coupon_list.length) {
      info.coupon_list = info.coupon_list.map((coupon) => {
        coupon.name = coupon.type === '0' ? '满减券' :
          coupon.type === '1' ? '打折券' :
            coupon.type === '2' ? '代金券' :
              coupon.type === '3' ? '兑换券' :
                coupon.type === '4' ? '储值券' :
                  coupon.type === '5' ? '通用券' : 
                    coupon.type === '6' ? '次数券' : '';
        return coupon;
      })
    }
    if (info.birthday_coupon_list && Array.isArray(info.birthday_coupon_list) && info.birthday_coupon_list.length) {
      info.birthday_coupon_list = info.birthday_coupon_list.map((coupon) => {
        coupon.name = coupon.type === '0' ? '满减券' :
          coupon.type === '1' ? '打折券' :
            coupon.type === '2' ? '代金券' :
              coupon.type === '3' ? '兑换券' :
                coupon.type === '4' ? '储值券' :
                  coupon.type === '5' ? '通用券' : 
                    coupon.type === '6' ? '次数券' : '';
        return coupon;
      })
    }
    if (info.coupon_list && info.coupon_list.length) {
      specialNoteArr.push('优惠券');
    }
    if (info.balance && info.balance != 0) {
      specialNoteArr.push('储值');
    }
    if (info.integral && info.integral != 0) {
      specialNoteArr.push('积分');
    }
    if (this.data.slideData[this.data.currentIndex].indexOf('/vip-card/') === -1) {
      isUserDiyLogo = true;
    }
    this.setData({
      currentCard: info,
      currentComboIndex: 0,
      price: price,
      specialNote: specialNoteArr.join('、') + '在付费会员卡有效期限内每月赠送一次',
      isUserDiyLogo: isUserDiyLogo
    })
  },
  addPaidCardOrder: function () {
    let _this = this;

    this.setData({
      requesting: true
    })
    app.sendRequest({
      url: '/index.php?r=appVipCard/addPaidVipCardOrder',
      method: 'post',
      data: {
        data_id: _this.data.currentCard.id,
        price: _this.data.price,
        sub_shop_app_id: _this.data.franchiseeId
      },
      hideLoading: false,
      success: function (res) {
        let orderId = res.data;

        _this.payOrder(orderId)
      }
    })
  },
  getCollectUserinfoConfig: function () {
    let _this = this;
    let userInfo = app.getUserInfo();

    app.sendRequest({
      url: '/index.php?r=appVipCard/getCollectUserinfoConfig',
      method: 'post',
      hideLoading: true,
      data: {
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          isNeedCollect: res.data.need_collect_info ? res.data.need_collect_info : 0
        })
      }
    })
  },
  payOrder: function (orderId) {
    let _this = this;

    function paySuccess() {
      if (_this.data.isNeedCollect) {
        app.turnToPage('/pages/userCenter/userCenter?id=' + _this.data.currentCard.id);
      } else {
        app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
      }
    }

    function payFail() {
      app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
    }

    if (this.data.price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          paySuccess();
        },
        fail: function () {
          payFail();
        },
        complete: function () {
          _this.setData({
            requesting: false
          })
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        let param = res.data;

        param.orderId = orderId;
        param.goodsType = 8;
        param.success = paySuccess;
        param.fail = payFail;
        _this.wxPay(param);
      },
      complete: function () {
        _this.setData({
          requesting: false
        })
      }
    })
  },
  // 调用微信支付接口
  wxPay: function (param) {
    let _this = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      success: function (res) {
        _this.wxPaySuccess(param);
        typeof param.success === 'function' && param.success();
      },
      fail: function (res) {
        if (res.errMsg === 'requestPayment:fail cancel') {
          _this.showModal({
            content: '支付已取消',
            complete: function () {
              typeof param.fail === 'function' && param.fail();
            }
          });
          return;
        }
        if (res.errMsg === 'requestPayment:fail') {
          res.errMsg = '支付失败';
        }
        _this.showModal({
          content: res.errMsg
        })
        _this.wxPayFail(param, res.errMsg);
        typeof param.fail === 'function' && param.fail();
      }
    })
  },
  wxPaySuccess: function (param) {
    let orderId = param.orderId,
      formId = param.package.substr(10),
      _this = this;

    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/SendXcxOrderCompleteMsg',
      data: {
        formId: formId,
        order_id: orderId
      }
    })
    if (this.isNeedCollect == 0 && this.data.userPaidVipCard.vip_id != this.data.currentCard.id) {
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=appVipCard/sendRecvVipCardMsg',
        data: {
          formId: formId,
          vip_id: _this.data.currentCard.id,
          sub_shop_app_id: _this.data.franchiseeId
        }
      })
    }
  },
  wxPayFail: function (param, errMsg) {
    let orderId = param.orderId,
      formId = param.package.substr(10);

    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/SendXcxOrderCompleteMsg',
      data: {
        formId: formId,
        t_num: 'AT0010',
        order_id: orderId,
        fail_reason: errMsg
      }
    })
  },
  selectCombo: function (e) {
    let index = e.currentTarget.dataset.index;
    let currentCard = this.data.currentCard;
    let price = index == 0 ? currentCard.price : currentCard.combo[index - 1].price ? currentCard.combo[index - 1].price : currentCard.combo[index - 1].original_price;

    this.setData({
      currentComboIndex: index,
      price: price
    })
  },
  // 跳转到会员日列表
  gotoMemberDay: function () {
    app.turnToPage('/eCommerce/pages/memberDay/memberDay');
  }
})
