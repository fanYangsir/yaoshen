
var app = getApp()
var util = require('../../../utils/util.js')
var WxParse = require('../../../components/wxParse/wxParse.js');

Page({
  data: {
    goodsId: '',
    groupId: '',
    goodsInfo: {},
    modelStrs: {},
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      buyCount: 1,
      groupBuyCount: 1,
      groupNum: '',
      groupPrice: '',
      groupLeaderPrice: ''
    },
    more_members_arr: [],
    currentModelInfo: {},
    commentNums: [],
    commentExample: '',
    defaultPhoto: '',
    allStock: '',
    addToShoppingCartHidden: true,
    addToGroupBuyCart: true,
    ifOpenNewGroup: true,
    ifAddToShoppingCart: true,
    isParticipate: false,
    priceDiscountStr: '',
    ifAllGroup: true,
    clock: [],
  },
  time: '',
  onLoad: function (options) {
    var goodsId = options.detail || '',
      contact = options.contact || '',
      franchiseeId = options.franchisee || '',
      cartGoodsNum = options.cart_num || '',
      teamToken = options.teamToken || '',
      defaultPhoto = app.getDefaultPhoto();

    this.setData({
      goodsId: goodsId,
      contact: contact,
      teamToken: teamToken,
      defaultPhoto: defaultPhoto,
      franchiseeId: franchiseeId,
      cartGoodsNum: cartGoodsNum
    })
    this.dataInitial();
  },
  onUnload: function () {
    !!this.time ? this.time.clear() : '';
  },
  dataInitial: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: this.data.goodsId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        that.modifyGoodsDetail(res);
      }
    })
  },
  currentModelInitial: function () {
    let _this = this;
    let goodsInfo = this.data.goodsInfo;
    let currentGroupId = this.data.groupId;
    let currentTeamToken= this.data.teamToken;
    
    goodsInfo.group_buy_team_list.map((val) => {
      if (val.team_token === currentTeamToken) {
        let more_members_arr = [];
        let max_user_num = Number(val.max_user_num);
        let length = 0;
        if(max_user_num <= 5){
          length = max_user_num - (val.member.length + 1);
          for (let i = 0; i < length; i++) {
            more_members_arr.push('');
          }
        }else {
          length = 3 - (val.member.length + 1);
          for (let i = 0; i < length; i++) {
            more_members_arr.push('');
          }
        }
        //倒计时的调用
        _this.endTime = _this.countDown(val.expired_time);
        _this.setData({
          currentModelInfo: val,
          more_members_arr: more_members_arr
        })
      }
    })
  },
  onShareAppMessage: function () {
    var that = this,
      goodsId = this.data.goodsId,
      contact = this.data.contact,
      franchiseeId = this.data.franchiseeId,
      url = '/pages/groupGoodsDetail/groupGoodsDetail?detail=' + goodsId + '&contact=' + contact + (franchiseeId ? '&franchisee=' + franchiseeId : '') + (app.globalData.pageShareKey ? ('&pageShareKey=' + app.globalData.pageShareKey) : '');

    return app.shareAppMessage({
      path: url,
      success: function (addTime) {
        // 转发获取积分
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
    });
  },
  showQRCodeComponent: function () {
    let that = this;
    let goodsInfo = this.data.goodsInfo;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: {
        obj_id: that.data.goodsId,
        type: 6,
        text: goodsInfo.title,
        price: (goodsInfo.highPrice > goodsInfo.lowPrice && goodsInfo.lowPrice != 0 ? (goodsInfo.lowPrice + ' ~ ' + goodsInfo.highPrice) : goodsInfo.price),
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        sub_shop_id: that.data.franchiseeId
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
  goToMyOrder: function () {
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/myOrder/myOrder' + (franchiseeId ? '?franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToShoppingCart: function () {
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/shoppingCart/shoppingCart' + (franchiseeId ? '?franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  goToCommentPage: function () {
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/goodsComment/goodsComment?detail=' + this.data.goodsId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goodsCoverOnload: function (e) {
    var originalWidth = e.detail.width,
      originalHeight = e.detail.height;

    //获取图片的原始长宽
    var windowWidth = 0;
    var imageWidth = 0, imageHeight = 0;

    var res = app.getSystemInfoData();

    windowWidth = res.windowWidth;
    imageWidth = windowWidth;
    imageHeight = imageWidth * originalHeight / originalWidth;
    this.setData({
      goodsCoverWidth: imageWidth,
      goodsCoverHeight: imageHeight
    });
  },
  modifyGoodsDetail: function (res) {
    var pages = getCurrentPages(),
      _this = pages[pages.length - 1],
      goods = res.data[0].form_data,
      description = goods.description,
      goodsModel = [],
      selectModels = [],
      modelStrs = {},
      price = 0,
      discountStr = '',
      allStock = 0,
      selectStock, selectPrice, selectModelId, matchResult, selectGroupPrice, selectGroupLeaderPrice, selectGroupNum,
      i, j;

    WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);

    if (goods.model_items.length) {
      var items = goods.model_items;
      for (i = 0, j = items.length; i < j; i++) {
        price = Number(items[i].price);
        goods.highPrice = goods.highPrice > price ? goods.highPrice : price;
        goods.lowPrice = goods.lowPrice < price ? goods.lowPrice : price;
        allStock += Number(items[i].stock);
        if (i == 0) {
          selectPrice = price;
          selectGroupNum = Number(items[i].num_of_people);
          selectGroupPrice = Number(items[i].group_buy_normal_price);
          selectGroupLeaderPrice = Number(items[i].group_buy_leader_price);
          selectStock = items[0].stock;
          selectModelId = items[0].id;
        }
      }
      allStock = allStock / goods.group_buy_info.num_of_people_list.length;
    } else {
      selectPrice = goods.price;
      selectStock = goods.stock;
    }
    for (var key in goods.model) {
      if (key) {
        var model = goods.model[key],
          modelId = model.id;
        goodsModel.push(model);
        modelStrs[model.id] = model.subModelName.join('、');
        selectModels.push(model.subModelId[0]);
      }
    }
    goods.model = goodsModel;
    if (Number(goods.max_can_use_integral) != 0) {
      discountStr = '（积分可抵扣' + (Number(goods.max_can_use_integral) / 100) + '元）';
    }
    _this.setData({
      goodsInfo: goods,
      modelStrs: modelStrs,
      'selectModelInfo.models': selectModels,
      'selectModelInfo.stock': selectStock,
      'selectModelInfo.price': selectPrice,
      'selectModelInfo.groupNum': selectGroupNum,
      'selectModelInfo.groupPrice': selectGroupPrice,
      'selectModelInfo.groupLeaderPrice': selectGroupLeaderPrice,
      'selectModelInfo.modelId': selectModelId || '',
      allStock: allStock,
      priceDiscountStr: discountStr,
    })
    _this.getAssessList();
    _this.currentModelInitial();
  },
  getAssessList: function () {
    var that = this;
    app.getAssessList({
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded;'
      },
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: 0
        },
        page: 1,
        page_size: 20,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        var commentExample = res.data[0];
        that.setData({
          commentNums: res.num,
          commentExample: commentExample || ''
        })
      }
    });
  },
  showGroupBuy: function ($event) {
    let type = $event.target.dataset.type;
    this.setData({
      addToGroupBuyCart: false,
      ifOpenNewGroup: false,
      isParticipate: type === 'join' ? true : false
    })
  },
  //去参团的方法
  participateGroup: function (e) {
    let groupInfo = this.data.goodsInfo.group_buy_team_list,
      groupNum = '',
      teamToken = '';

    groupInfo.map((val) => {
      if (val.team_token === this.data.teamToken) {
        groupNum = val.max_user_num;
        teamToken = val.team_token;
      }
    })
    this.setData({
      addToGroupBuyCart: false,
      ifOpenNewGroup: false,
      isParticipate: true,
      'selectModelInfo.groupNum': groupNum,
      teamToken: teamToken
    })
    this.resetSelectCountPrice();
  },
  showBuyDirectly: function () {
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false
    })
  },
  showAddToShoppingCart: function () {
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true
    })
  },
  hideGroupBuyCart: function () {
    this.setData({
      addToGroupBuyCart: true
    })
  },
  hiddeAddToShoppingCart: function () {
    this.setData({
      addToShoppingCartHidden: true
    })
  },
  selectSubModel: function (e) {
    var dataset = e.target.dataset,
      modelIndex = dataset.modelIndex,
      submodelIndex = dataset.submodelIndex,
      data = {};

    data['selectModelInfo.models[' + modelIndex + ']'] = this.data.goodsInfo.model[modelIndex].subModelId[submodelIndex];
    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function () {
    var selectModelIds = this.data.selectModelInfo.models.join(','),
      modelItems = this.data.goodsInfo.model_items,
      data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model) {
        if (modelItems[i].model == selectModelIds && modelItems[i].num_of_people == this.data.selectModelInfo.groupNum) {
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.groupPrice'] = modelItems[i].group_buy_normal_price;
          data['selectModelInfo.groupLeaderPrice'] = modelItems[i].group_buy_leader_price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          break;
        }
      } else {
        if (modelItems[i].num_of_people == this.data.selectModelInfo.groupNum) {
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.groupPrice'] = modelItems[i].group_buy_normal_price;
          data['selectModelInfo.groupLeaderPrice'] = modelItems[i].group_buy_leader_price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          break;
        }
      }
    }
    this.setData(data);
  },
  clickMinusButton: function (e) {
    var count = this.data.selectModelInfo.buyCount;

    if (count <= 1) {
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1
    });
  },
  clickGroupMinusButton: function (e) {
    var count = this.data.selectModelInfo.groupBuyCount;

    if (count <= 1) {
      return;
    }
    this.setData({
      'selectModelInfo.groupBuyCount': count - 1
    });
  },
  clickPlusButton: function (e) {
    var selectModelInfo = this.data.selectModelInfo,
      count = selectModelInfo.buyCount,
      stock = selectModelInfo.stock,
      max = this.data.goodsInfo.group_buy_info.user_limit_buy;

    if (count >= stock) {
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1
    });
  },
  clickGroupPlusButton: function (e) {
    var selectModelInfo = this.data.selectModelInfo,
      count = selectModelInfo.groupBuyCount,
      stock = selectModelInfo.stock,
      max = this.data.goodsInfo.group_buy_info.user_limit_buy;

    if (count >= stock || count >= max) {
      return;
    }
    this.setData({
      'selectModelInfo.groupBuyCount': count + 1
    });
  },
  sureAddToShoppingCart: function () {
    var that = this,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: this.data.franchiseeId || ''
      };

    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        app.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(function () {
          app.hideToast();
          that.hiddeAddToShoppingCart();
        }, 500);
      }
    })
  },
  buyDirectlyNextStep: function (e) {
    var franchiseeId = this.data.franchiseeId,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: franchiseeId || ''
      };

    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr);

        franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
        app.turnToPage(pagePath);
      }
    })
  },
  groupBuyDirectlyNextStep: function (e) {
    var franchiseeId = this.data.franchiseeId,
      _this = this,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.groupBuyCount,
        sub_shop_app_id: franchiseeId || '',
        is_group_buy: 1,
        num_of_group_buy_people: this.data.selectModelInfo.groupNum || '',
        team_token: ''
      };

    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr) + '&limit_buy=' + _this.data.goodsInfo.group_buy_info.user_limit_buy + '&is_group=true' + '&group_buy_people=' + _this.data.selectModelInfo.groupNum;

        franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
        app.turnToPage(pagePath);
      }
    })
  },
  participateGroupBuy: function (e) {
    var franchiseeId = this.data.franchiseeId,
      _this = this,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.groupBuyCount,
        sub_shop_app_id: franchiseeId || '',
        is_group_buy: 1,
        num_of_group_buy_people: this.data.selectModelInfo.groupNum || '',
        team_token: this.data.teamToken
      };

    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr) + '&limit_buy=' + _this.data.goodsInfo.group_buy_info.user_limit_buy + '&is_group=true'+ '&team_token=' + _this.data.teamToken + '&group_buy_people=' + _this.data.selectModelInfo.groupNum;
        franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
        app.turnToPage(pagePath);
      }
    })
  },
  makeAppointment: function () {
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/makeAppointment/makeAppointment?detail=' + this.data.goodsId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  inputBuyCount: function (e) {
    var count = e.detail.value;
    this.setData({
      'selectModelInfo.buyCount': +count
    });
  },
  showShareMenu: function () {
    app.showShareMenu();
  },
  turnToGroupRules: function () {
    app.turnToPage("/eCommerce/pages/groupRules/groupRules");
  },
  selectGroupNum: function (e) {
    this.setData({ 'selectModelInfo.groupNum': e.currentTarget.dataset.num });
    this.resetSelectCountPrice();
  },
  showAll: function (e) {
    let _this = this;
    this.setData({ ifAllGroup: !_this.data.ifAllGroup });
  },

  //计算倒计时时间
  parseArr: function (time) {
    let arr = [];

    arr = time.map(function (el) {
      return el.expired_time * 1000 - now;
    })
    this.data.arr = arr;
  },
  //倒计时方法
  countDown: function (time) {
    let _this = this;
    let now = (new Date()).valueOf();

    time = time * 1000;

    let t = setInterval(function () {
      let prettyTime = time - now - 500 >= 0 ? _this.date_format(time - now) : '已截止';
      time -= 500;

      _this.setData({ endTime: prettyTime });
    }, 500);
    return {
      clear: function () {
        clearInterval(t);
      }
    }
  },

  // 时间格式化输出，如03:25:19 86。每500ms都会调用一次
  date_format: function (micro_second) {
    // 秒数
    let second = Math.floor(micro_second / 1000);
    // 小时位
    let hr = Math.floor(second / 3600);
    // 分钟位
    let min = this.fill_zero_prefix(Math.floor((second - hr * 3600) / 60));
    // 秒位
    let sec = this.fill_zero_prefix((second - hr * 3600 - min * 60));// equal to => var sec = second % 60;

    return hr + ":" + min + ":" + sec;
  },

  // 把1970 年 1 月 1 日至当前的值毫秒数转换为时分秒。
  getDate: function (micro_second) {
    let date = new Date(micro_second);
    // 小时位
    let hr = date.getHours();
    // 分钟位
    let min = date.getMinutes();
    // 秒位
    let sec = date.getSeconds();

    return hr + ":" + min + ":" + sec;
  },

  // 位数不足补零
  fill_zero_prefix: function (num) {
    return num < 10 ? "0" + num : num
  }
})
