var app = getApp()
var util = require('../../utils/util.js')
var WxParse = require('../../components/wxParse/wxParse.js');

Page({
  data: {
    goodsId: '',
    goodsInfo: {},
    modelStrs: {},
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text : ''
    },
    pageQRCodeData:{
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    commentArr: [],
    commentNums: [],
    commentExample: '',
    commentPage: 1,
    commnetType: 0,
    commentTotalPage: '',
    defaultPhoto: '',
    allStock: '',
    addToShoppingCartHidden: true,
    ifAddToShoppingCart: true,
    priceDiscountStr: '',
    page_hidden: true,
    appointmentPhone:'',
    detailCommetType: 'detail',
    carouselCurrentIndex: 1,
    imageOrVideo: 'image',
    storeStyle: '',
    footPrintIndex: 0,
    showFootPrint: false,
    animationData: {},
    pageStaySeconds: 0,
    userSetEventsArr: [],
  },
  onLoad: function(options){
    var goodsId = options.detail,
        franchiseeId = options.franchisee || '',
        cartGoodsNum = options.cart_num || 0,
        defaultPhoto = app.getDefaultPhoto(),
        goodsType = options.goodsType || 0,
        userToken = options.user_token || '';
    this.setData({
      goodsId: goodsId,
      defaultPhoto: defaultPhoto,
      franchiseeId: franchiseeId,
      cartGoodsNum: cartGoodsNum,
      goodsType : goodsType,
      isSeckill : goodsType == 'seckill' ? true : false
    })
    this.dataInitial();
    //推广存储user_token
    if(userToken){
      app.globalData.PromotionUserToken = userToken;
    }
    this.videoContext = wx.createVideoContext('goodsDetail-video');
  },
  onReachBottom: function(){
    if (this.data.detailCommetType == 'comment' && this.data.commentPage <= this.data.commentTotalPage){
      this.getAssessList(this.data.commentType, this.data.commentPage, 1);
    }
  },
  dataInitial: function () {
    var that = this;
    this.getAppECStoreConfig();
    // 获取用户设置的定时器事件
    this.getUserSetEvents();
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: this.data.goodsId,
        sub_shop_app_id: this.data.franchiseeId ,
        is_seckill: this.data.isSeckill ? 1 : '',
        message_notice_type: 1,
      },
      success: that.modifyGoodsDetail,
      complete: function(){
        that.setData({
          page_hidden: false
        })
      }
    })
  },
  onShareAppMessage: function(){
    this.setData({
      pageQRCodeData: {
        shareDialogShow: "100%",
        shareMenuShow: false,
      }
    })
    let that = this,
        goodsId = this.data.goodsId,
        franchiseeId = this.data.franchiseeId,
        cartGoodsNum = this.data.cart_num || '',
        isSeckill = this.data.isSeckill,
        title = this.data.goodsInfo.share_title,
        shareImage = this.data.goodsInfo.img_urls ? this.data.goodsInfo.img_urls[0] : this.data.goodsInfo.cover,
        urlSeckill = isSeckill ? '&goodsType=seckill' : '',
        urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      path = '/pages/goodsDetail/goodsDetail?detail=' + goodsId + (franchiseeId ? '&franchisee=' + franchiseeId + '&cart_num=' + cartGoodsNum : '') + urlSeckill + urlPromotion + (app.globalData.pageShareKey ? ('&pageShareKey=' + app.globalData.pageShareKey) : '');

    return app.shareAppMessage({
      path: path,
      title: title,
      imageUrl: shareImage,
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
  onUnload: function () {
    let dataObj = this.data;
    if(this.downcount){
      this.downcount.clear();
    }
    // 页面卸载清除计时定时器
    let pageTimer = dataObj.countPageStaySecondsTimer;
    if (pageTimer) {
      clearInterval(pageTimer);
    }
  },
  goToMyOrder: function(){
    var franchiseeId = this.data.franchiseeId,
        pagePath = '/eCommerce/pages/myOrder/myOrder?goodsType=' + this.data.goodsInfo.goods_type + '&currentIndex=0' + (franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToShoppingCart: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/shoppingCart/shoppingCart'+(franchiseeId ? '?franchisee='+franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToHomepage: function(){
    let that = this;
    let franchiseeId = that.data.franchiseeId;
    if (franchiseeId){
      let pages = getCurrentPages();
      let p = pages[pages.length-2];
      if(!p){
        app.sendRequest({
          url: '/index.php?r=AppShop/GetAppShopByAppId',
          data: {
            parent_app_id: app.getAppId(),
            sub_app_id: franchiseeId
          },
          success: function (res) {
            let data = res.data;
            if (data) {
              let mode = data.mode_id;
              let param = {};

              param.detail = franchiseeId;
              if (data.audit == 2) {
                param.shop_id = data.id;
              }
              app.goToFranchisee(mode, param, true);
            }
          }
        })
      }else if (p.route == 'franchisee/pages/goodsMore/goodsMore'){
        app.turnBack({ delta: 2 });
      }else{
        app.turnBack();
      }
    }else{
      var router = app.getHomepageRouter();
      app.reLaunch({url: '/pages/'+router+'/'+router});
    }
  },
  goToCommentPage: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/goodsComment/goodsComment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goodsCoverOnload: function(e){
    // var _this = this,
    //     originalWidth = e.detail.width,
    //     originalHeight = e.detail.height;

    // //获取图片的原始长宽
    // var windowWidth = 0;
    // var imageWidth = 0, imageHeight = 0;

    // wx.getSystemInfo({
    //   success: function (res) {
    //     windowWidth = res.windowWidth;
    //     imageWidth = windowWidth;
    //     imageHeight = imageWidth * originalHeight / originalWidth;
    //     _this.setData({
    //       goodsCoverWidth: imageWidth,
    //       goodsCoverHeight: imageHeight
    //     })
    //   }
    // })
  },
  modifyGoodsDetail: function(res){
    var _this = this,
        goods = res.data[0].form_data,
        unitType = (goods.appointment_info && goods.appointment_info.unit_type) || '',
        description = goods.description,
        goodsModel = [],
        selectModels = [],
        modifySelectModels = '',
        modelStrs = {},
        price = 0,
        discountStr = '',
        allStock = 0,
        selectStock, selectPrice, selectModelId, matchResult,selectVirtualPrice,selectText = '',
        selectImgurl = '',
        appointment_desc,
        appointmentPhone; 
    this.setData({
      unitType: unitType || '',
      appointmentDesc: goods.appointment_info && goods.appointment_info.appointment_desc ? goods.appointment_info.appointment_desc.replace(/<br \/>/g, "\r\n") : '更多优惠资讯详情请联系商家!',
      appointmentPhone: goods.appointment_info && goods.appointment_info.appointment_phone ? goods.appointment_info.appointment_phone:'',
      displayComment:goods.appointment_info &&  goods.appointment_info.display_comment == '1' ?goods.appointment_info.display_comment : ''
    });
    description = description ? description.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : description;
    goods.description = description
    WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);

    for(var key in goods.model){
      if (!('1' in goods.model)) {
        delete goods.model[0];
      }
      if(key){
        var model = goods.model[key];
        goodsModel.push(model);
        if(model && model.subModelName){
          if (key == '1' && goods.goods_type == '1'){
            for(var index in model.subModelName){
              var adjustTime =  model.subModelName[index].split('-'),
              submodel = model.subModelName[index].substring(6,8),
              endHours = (submodel - 24) >= 10 ?  (submodel-24) : '0'+ (submodel - 24);
              model.subModelName[index] = submodel >= 24 ?  adjustTime[0] + '-' + '次日' + endHours + ':' + adjustTime[1].split(':')[1]  :adjustTime[0] +  '-当日' + adjustTime[1] ;
            }
          }
          if(goods.goods_type == '1' && model.id == '0'){
            for(var index in model.subModelName){
              model.subModelName[index] = model.subModelName[index] + (goods.appointment_info && goods.appointment_info.unit);
            }
          }
          modelStrs[model.id] = model.subModelName.join('、');
          selectModels.push(model.subModelId[0]);
          modifySelectModels = selectModels.toString();
          selectText += '“' + model.subModelName[0] + '” ';
        }

      }
    }
    if(goods.model_items.length){
      var items = goods.model_items;

      if(goods.is_seckill == 1){ //假如是秒杀
        for (let i = 0; i < items.length; i++) {
          let seckill_price = +items[i].seckill_price;
          let modifyGoodsmodelseckill = items[i].model;
          goods.seckill_highPrice = goods.seckill_highPrice >= seckill_price ? goods.seckill_highPrice : seckill_price;
          goods.seckill_lowPrice = goods.seckill_lowPrice <= seckill_price ? goods.seckill_lowPrice : seckill_price;
          allStock += Number(items[i].seckill_stock);

          if(modifyGoodsmodelseckill == modifySelectModels){
            selectPrice = items[i].seckill_price;
            selectStock = items[i].seckill_stock;
            selectModelId = items[i].id;
            selectImgurl = items[i].img_url;
          }
        }
      }else{
        for (let i = 0; i < items.length; i++) {
          price = Number(items[i].price);
          let virtualPrice = Number(items[i].virtual_price);
          let modifyGoodsmodel = items[i].model;
          goods.highPrice = goods.highPrice > price ? goods.highPrice : price;
          goods.lowPrice = goods.lowPrice < price ? goods.lowPrice : price;
          goods.virtual_price = goods.virtual_price > virtualPrice ? goods.virtual_price : virtualPrice;
          allStock += Number(items[i].stock);
          if(modifyGoodsmodel == modifySelectModels){
            selectPrice = items[i].price;
            selectStock = items[i].stock;
            selectModelId = items[i].id;
            selectImgurl = items[i].img_url;
            selectVirtualPrice = items[i].virtual_price;
          }
        }
      }
    } else {
      if(goods.is_seckill == 1){ //假如是秒杀
        selectPrice = goods.seckill_price;
        selectStock = goods.seckill_stock;
        allStock = goods.seckill_stock;
      }else{
        selectPrice = goods.price;
        selectStock = goods.stock;
        selectVirtualPrice = goods.virtual_price;
      }
      selectImgurl = goods.cover;
    }
    
    goods.model = goodsModel;
    if (Number(goods.max_can_use_integral) != 0 ) {
      discountStr = '（积分可抵扣' + (Number(goods.max_can_use_integral) / 100) + '元）';
    }
    if(goods.is_seckill == 1){
      goods.downCount = {
        hours : '00' ,
        minutes : '00' ,
        seconds : '00'
      };
      if(goods.seckill_start_state == 0){
        _this.downcount = app.beforeSeckillDownCount(goods , _this , 'goodsInfo');
      }else if(goods.seckill_start_state == 1){
        _this.downcount = app.duringSeckillDownCount(goods , _this , 'goodsInfo');
      }
    }
    _this.setData({
      goodsInfo: goods,
      modelStrs: modelStrs,
      'selectModelInfo.models': selectModels || '',
      'selectModelInfo.stock': selectStock || '',
      'selectModelInfo.price': selectPrice || '',
      'selectModelInfo.modelId': selectModelId || '',
      'selectModelInfo.models_text' : selectText || '',
      'selectModelInfo.imgurl' : selectImgurl || '',
      'selectModelInfo.virtualPrice': selectVirtualPrice || '',
      allStock: allStock || '',
      priceDiscountStr: discountStr || '',
    })
    _this.getAssessList(0, 1);
  },
  showBuyDirectly: function(){
    if(this.data.isSeckill && this.data.goodsInfo.seckill_start_state != 1){
      app.showModal({content: '当前秒杀商品不在秒杀时间范围内，不能立即购买'});
      return ;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false,
      imageOrVideo: 'image'
    })
    // let newData = {
    //   goodsId: this.data.goodsId,
    //   franchiseeId: this.data.franchiseeId,
    //   showBuynow: true,
    //   hideAddShoppingCart: true,
    //   showVirtualPrice: this.data.isShowVirtualPrice
    // }
    // this.selectComponent('#component-goodsShoppingCart').showDialog(newData);
    // this.setData({
    //   imageOrVideo: 'image'
    // })
  },
  showAddToShoppingCart: function(){
    if(this.data.isSeckill && this.data.goodsInfo.seckill_start_state == 2){
      app.showModal({content: '当前秒杀已结束，不能加入购物车'});
      return ;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true,
      imageOrVideo: 'image'
    })
    // let newData = {
    //   goodsId: this.data.goodsId,
    //   franchiseeId: this.data.franchiseeId,
    //   showBuynow: false,
    //   showVirtualPrice: this.data.isShowVirtualPrice
    // }
    // this.selectComponent('#component-goodsShoppingCart').showDialog(newData);
    // this.setData({
    //   imageOrVideo: 'image'
    // })
  },
  hiddeAddToShoppingCart: function(){
    this.setData({
      addToShoppingCartHidden: true
    })
  },
  selectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.selectModelInfo.models,
        model = this.data.goodsInfo.model,
        text = '';

    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];

    // 拼已选中规格文字
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if( selectModels[i] == selectSubModelId[j] ){
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['selectModelInfo.models'] = selectModels;
    data['selectModelInfo.models_text'] = text;

    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.selectModelInfo.models.join(','),
        modelItems = this.data.goodsInfo.model_items,
        data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        if(_this.data.isSeckill){  //假如是秒杀
          data['selectModelInfo.stock'] = modelItems[i].seckill_stock;
          data['selectModelInfo.price'] = modelItems[i].seckill_price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
        }else{
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
          data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price;
        }
        break;
      }
    }
    this.setData(data);
  },
  clickMinusButton: function(e){
    var count = this.data.selectModelInfo.buyCount;

    if(count <= 1){
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1
    });
  },
  clickPlusButton: function(e){
    var selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        count = selectModelInfo.buyCount,
        stock = selectModelInfo.stock;

    if(count >= stock) {
      app.showModal({content: '购买数量不能大于库存'});
      return;
    }
    if(this.data.isSeckill && count >= goodsInfo.seckill_buy_limit){
      app.showModal({content: '购买数量不能大于秒杀限购数量'});
      return ;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1
    });
  },
  sureAddToShoppingCart: function(){
    var that = this,
        param = {
                  goods_id: this.data.goodsId,
                  model_id: this.data.selectModelInfo.modelId || '',
                  num: this.data.selectModelInfo.buyCount,
                  sub_shop_app_id: this.data.franchiseeId || '',
                  is_seckill : this.data.isSeckill ? 1 : '',
                  message_notice_type: 1
                };

    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res){
        app.showToast({
          title: '添加成功',
          icon: 'success'
        });

        setTimeout(function(){
          that.hiddeAddToShoppingCart();
        }, 1000);
      }
    })
  },
  buyDirectlyNextStep: function(e){
    // var that = this,
    //     param = {
    //               goods_id: this.data.goodsId,
    //               model_id: this.data.selectModelInfo.modelId,
    //               num: this.data.selectModelInfo.buyCount,
    //               formId: e.detail.formId,
    //               sub_shop_app_id: this.data.franchiseeId,
    //               is_seckill : this.data.isSeckill ? 1 : ''
    //             };

    // app.sendRequest({
    //   url: '/index.php?r=AppShop/addOrder',
    //   data: param,
    //   success: function(res){
    //     var franchiseeId = that.data.franchiseeId,
    //         pagePath = '/eCommerce/pages/orderDetail/orderDetail?detail='+res.data+(franchiseeId ? '&franchisee='+franchiseeId : '');

    //     that.hiddeAddToShoppingCart();
    //     app.turnToPage(pagePath);
    //   }
    // })
    var franchiseeId = this.data.franchiseeId,
        that = this,
        param = {
                  goods_id: this.data.goodsId,
                  model_id: this.data.selectModelInfo.modelId || '',
                  num: this.data.selectModelInfo.buyCount,
                  sub_shop_app_id: franchiseeId || '',
                  is_seckill : this.data.isSeckill ? 1 : ''
                };

    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res){
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr='+ encodeURIComponent(cart_arr);

        franchiseeId && (pagePath += '&franchisee='+franchiseeId);
        that.hiddeAddToShoppingCart();
        app.turnToPage(pagePath);
      }
    })
  },
  makeAppointment: function(){
    var franchiseeId = this.data.franchiseeId,
        unitTime = this.data.modelStrs[0] && this.data.modelStrs[0].substring(this.data.modelStrs[0].length-1),
        unitType = this.data.unitType != 6 ? (unitTime == '分' ? 1 : (unitTime == '时' ? 2 : 3)) : '6',
        pagePath = '/eCommerce/pages/makeAppointment/makeAppointment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '') +('&param=' + unitType)
    app.turnToPage(pagePath);
  },
  inputBuyCount: function(e){
    var count = +e.detail.value,
        selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        stock = +selectModelInfo.stock;

    if(count >= stock) {
      count = stock;
      app.showModal({content: '购买数量不能大于库存'});
    }
    if(this.data.isSeckill && count >= +goodsInfo.seckill_buy_limit){
      count = goodsInfo.seckill_buy_limit;
      app.showModal({content: '购买数量不能大于秒杀限购数量'});
    }
    this.setData({
      'selectModelInfo.buyCount': +count
    });
  },
  showQRCodeComponent:function(){
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
        type: this.data.isSeckill ? 5 : 1,
        text: goodsInfo.title,
        price: (goodsInfo.highPrice > goodsInfo.lowPrice && goodsInfo.lowPrice != 0 ? (goodsInfo.lowPrice + ' ~ ' + goodsInfo.highPrice) : goodsInfo.price),
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        max_can_use_integral: goodsInfo.max_can_use_integral,
        integral: goodsInfo.integral,
        sub_shop_id: that.data.franchiseeId,
        p_id: app.globalData.p_id || ''
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
  showShareMenu: function(){
    app.showShareMenu();
  },
  makePhoneCall: function(){
    app.makePhoneCall(this.data.appointmentPhone);
  },
  hideShareMenu: function(){
    this.setData({
      hideShareMenu: true
    })
  },
  showPageCode: function(){

  },
  oneSelectDetailCommet: function(e){
    this.setData({
      detailCommetType: e.target.dataset.type
    })
  },
  getAssessList: function (commnetType, page, append) {
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: commnetType
        },
        page: page,
        page_size: 20,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        var commentData = res.data;
        if (append) {
          commentData = that.data.commentArr.concat(commentData);
        }
        that.setData({
          commentArr: commentData,
          commentNums: res.num,
          commentPage: that.data.commentPage + 1,
          commentExample: res.data[0] || '',
          commentTotalPage: res.total_page,
          displayComment: that.data.goodsInfo.goods_type === '0' ? (+res.num[0] > 0 ? false : true) : (that.data.goodsInfo.appointment_info && that.data.goodsInfo.appointment_info.display_comment == '1' ? that.data.goodsInfo.appointment_info.display_comment : '')
        })
      }
    });
  },
  clickCommentLabel: function (e) {
    var commentType = e.target.dataset.type,
      data = {};
    data.commentPage = 1;
    data.commnetType = commentType;
    this.setData(data);
    this.getAssessList(commentType, 1);
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  carouselIndex: function (event){
    this.setData({
      carouselCurrentIndex: event.detail.current + 1     
    })
  },
  toCouponList: function (){
    app.turnToPage('/eCommerce/pages/couponReceiveListPage/couponReceiveListPage');
  },
  changeImageOrVideo: function(event){
    this.setData({
      videoPoster: false,
      imageOrVideo: event.currentTarget.dataset.type
    })
  },
  toRecommendGoodsDetail: function(event){
    app.turnToGoodsDetail(event);
  },
  getAppECStoreConfig: function(){
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hidestock: (res.detail_fields && res.detail_fields.stock == 0) ? true : false,
        isShowVirtualPrice: (res.detail_fields && res.detail_fields.virtual_price == 1) ? true : false
      })
    }, this.data.franchiseeId);
  },
  startPlayVideo: function () {
    let video = wx.createVideoContext('carousel-video');
    this.setData({
      videoPoster: true
    })
    video.play();
  },
  footPrintRight: function(){
    let index = this.data.footPrintIndex - 1;
    if (index + this.data.goodsViewRecordList.length <= 0){return};
    this.setData({
      footPrintIndex: index
    })
  },
  footPrintLeft: function(){
    let index = this.data.footPrintIndex + 1;
    if (index > 0) { return };
    this.setData({
      footPrintIndex: index
    })
  },
  hideCompeletFoot: function(event){
    this.setData({
      showFootPrint: !this.data.showFootPrint
    })
  },
  hideFootPrint: function(){
    let animation = this.animation;
    animation.top('-100%').step();
    this.setData({
      animationData: animation.export()
    })
    setTimeout(() => {
      this.setData({
        footPrintIndex: 0,
        showFootPrint: false
      })
    },400) 
  },
  stopPropagation: function(event){
    
  },
  onPullDownRefresh: function(){
    if(this.data.franchiseeId){
      wx.stopPullDownRefresh();
      return;
    }  
    this.getGoodsViewRecordList();
  },
  toGoodsFootPrint: function(){
    this.hideFootPrint();
    app.turnToPage('/eCommerce/pages/goodsFootPrint/goodsFootPrint');
  },
  getGoodsViewRecordList: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/goodsViewRecordList',
      data: {
        page: 1,
        page_size: 10,
        goods_id: _this.data.goodsId
      },
      success: function (res) {
        if(!res.data.length){return};
        let animation = wx.createAnimation({
          duration: 500,
          timingFunction: 'linear',
        })
        _this.animation = animation;
        animation.top(0).step();
        _this.setData({
          showFootPrint: true,
          goodsViewRecordList: res.data
        })
        _this.setData({
          animationData: animation.export()
        })
      },
      complete: function(){
        wx.stopPullDownRefresh()
      }
    })
  },
  goFootPrintDetail: function(event){
    this.hideFootPrint();
    app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + event.currentTarget.dataset.id);
  },
  addFavoriteGoods: function(event){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addFavoriteGoods',
      data: {
        form_id: event.detail.formId,
        goods_id: _this.data.goodsId,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          'goodsInfo.is_favorite': 1
        })
      },
      complete: function(){
        wx.showToast({
          title: '收藏成功!',
          image: '/images/favorites.png'
        })
      }
    })
  },
  deleteFavoriteGoods: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteFavoriteGoods',
      method: 'post',
      data: {
        goods_id_arr: [_this.data.goodsId],
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          'goodsInfo.is_favorite': 0
        })
      },
      complete: function () {
        wx.showToast({
          title: '取消收藏!',
          image: '/images/cancel-favorites.png'
        })
      }
    })
  },
  // 获取用户设置的定时器
  getUserSetEvents: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=EventMessage/getEventByBehavior',
      hideLoading: true,
      data: {
        behavior: 14,
      },
      success: function (res) {
        if (+res.status === 0) {
          let eventsData = res.data;
          let eventsDataLen = eventsData && eventsData.length;
          let eventsDataArr = [];
          if (eventsData && eventsDataLen) {
            for (let i = 0; i < eventsDataLen; i++) {
              let tempObj = {};
              let trigger = eventsData[i].trigger;
              // 事件id
              tempObj.id = eventsData[i].id;
              // 定时器秒数
              tempObj.tally = trigger.condition.tally;
              eventsDataArr.push(tempObj);
            }
          }
          that.setData({
            userSetEventsArr: eventsDataArr
          });
          // 页面开始计时
          that.countPageStaySeconds();
        } else {
          // 数据返回有误
          console.log(res.data);
        }
      },
    });
  },
  // 计算页面停留时间
  countPageStaySeconds: function () {
    let that = this;
    let dataObj = this.data;
    let userEventsArr = dataObj.userSetEventsArr;
    let userEventsLen = userEventsArr && userEventsArr.length;
    // 停留在页面的秒数
    let timerSeconds = dataObj.pageStaySeconds || 0;
    if (userEventsArr && userEventsLen) {
      let countPageStaySecondsTimer = setInterval(function () {
        timerSeconds += 1;
        for (let i = 0; i < userEventsLen; i++) {
          // 事件id
          let eventId = userEventsArr[i].id;
          // 用户设置的定时器秒数
          let currentTimer = userEventsArr[i].tally;
          // 如果停留的时间和用户设置时间一致，调用相应的接口
          if (+currentTimer === timerSeconds) {
            that.timerTriggerEvent(eventId);
          }
          // 超过用户设置的最后一个定时器的时间，清除定时器
          if (timerSeconds > userEventsArr[userEventsLen - 1].tally) {
            clearInterval(countPageStaySecondsTimer);
            // 清空页面定时器
            that.setData({
              countPageStaySecondsTimer: ''
            });
          }
        }
        that.setData({
          pageStaySeconds: timerSeconds,
        });
      }, 1000);
      this.setData({
        countPageStaySecondsTimer: countPageStaySecondsTimer
      });
    }
  },
  // 定时器触发事件
  timerTriggerEvent: function (eventId) {
    if (eventId) { 
      let dataObj = this.data;
      // 商品id
      let goodsId = dataObj.goodsId || '';
      // 商品名称
      let goodsName = dataObj.goodsInfo.title;
      app.sendRequest({
        url: '/index.php?r=EventMessage/triggerEvent',
        method: 'post',
        hideLoading: true,
        data: {
          event_id: eventId,
          form_data: {
            'goods_id': goodsId,
            'goods_name': goodsName,
          }
        },
        success: function (res) {}
      });
    }
  },
  // 足迹滑动
  startFoot: function(event){
    let startX = event.changedTouches[0].clientX;
    this.footStartX = startX;
  },
  endFoot: function(event){
    let endX = event.changedTouches[0].clientX;
    let currentIndex = this.data.footPrintIndex;
    if (endX - this.footStartX > 0){
      currentIndex++;
      if (currentIndex > 0) { return };
    } else if(endX - this.footStartX < 0){
      currentIndex--;
      if (currentIndex + this.data.goodsViewRecordList.length <= 0) { return };
    }
    this.setData({
      footPrintIndex: currentIndex
    }) 
  }
})
