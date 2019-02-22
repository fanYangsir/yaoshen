var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {
    goodsList: [],
    selectAddress: {},
    discountList: [],
    selectDiscountInfo: {},
    orderRemark: '',
    is_self_delivery: 0,
    express_fee: '',
    balance: '',
    useBalance: true,
    deduction: '',
    discount_cut_price: '',
    group_buy_price: '',
    original_price: '',
    totalPayment: '',
    storeConfig: '',
    noAdditionalInfo: true,
    is_group:'',
    limit_buy: '',
    teamToken: '',
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    cashOnDelivery: false,
    selectDelivery: '',
    hasRequiredSuppInfo: false,
    additional_info: {},
  },
  isFromSelectAddress: false,
  franchisee_id: '',
  cart_id_arr: [],
  cart_data_arr: [],
  requesting: false,
  is_group:'',
  inputTimer: '',
  onLoad: function (options) {
    let teamToken = options.team_token || '';
    let group_buy_people = options.group_buy_people || 0;
    let limit_buy = options.limit_buy || '';

    this.franchisee_id = options.franchisee || '';
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.dataInitial();
    this.is_group = options.is_group || '';

    this.setData({ 
      limit_buy: limit_buy,
      is_group: this.is_group,
      teamToken: teamToken,
      group_buy_people: group_buy_people
    });
  },
  dataInitial: function () {
    this.getAppECStoreConfig();
    this.getCartList();
  },
  onShow: function(){
    if(this.isFromSelectAddress){
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
  },
  getCartList: function () {
    var _this = this,
        franchisee_id = this.franchisee_id;

    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 100,
        sub_shop_app_id: franchisee_id,
        parent_shop_app_id: franchisee_id ? app.globalData.appId : ''
      },
      success: function(res){
        var data = [];
        if(_this.cart_id_arr.length){
          for (var i = 0; i <= res.data.length - 1; i++) {
            if(_this.cart_id_arr.indexOf(res.data[i].id) >= 0){
              data.push(res.data[i]);
            }
          }
        } else {
          data = res.data;
        }

        for (var i = 0; i <= data.length - 1; i++) {
          var goods = data[i],
              modelArr = goods.model_value;
          goods.model_value_str = modelArr && modelArr.join ? modelArr.join('； ') : '';
          _this.cart_data_arr.push({
            cart_id: goods.id,
            goods_id: goods.goods_id,
            model_id: goods.model_id,
            num: goods.num
          });
        }
        _this.setData({
          goodsList: data
        });
      }
    })
  },
  getCalculationInfo: function(){
    var _this = this;

    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        sub_shop_app_id: this.franchisee_id,
        address_id: this.data.selectAddress.id,
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        selected_benefit: this.data.selectDiscountInfo,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info
      },
      success: function(res){
        let  info = res.data;
        let  benefits = info.can_use_benefit;
        let  goods_info = info.goods_info;
        let  additional_info_goods = [];
        let  selectDiscountInfo = info.selected_benefit_info;
        let  suppInfoArr = [];
        let  additional_goodsid_arr = [];

        let goodsBenefitsData = [];
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({ label: 'integral', value: [benefits.integral_benefit] });

        // 优惠券：兑换券操作
        if(selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false ){
          _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }

        for (var i = 0; i <= goods_info.length - 1; i++) {
          if(goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1){
            suppInfoArr.push(goods_info[i].delivery_id);
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }

        let group_buy_price = String(info.original_price - info.group_buy_discount_price);
        if(group_buy_price.split('.')[1]){
          group_buy_price = Number(group_buy_price).toFixed(2);
        }
        if (suppInfoArr.length && !_this.data.deliverydWrite){
          _this.getSuppInfo(suppInfoArr);
        }
        _this.setData({
          selectAddress: info.address,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          express_fee: info.express_fee,
          discount_cut_price: info.discount_cut_price,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          group_buy_price: group_buy_price,
          totalPayment: info.price,
          canCashDelivery: info.is_pay_on_delivery,
          cashOnDelivery: info.price > 0 ? _this.data.cashOnDelivery : false,
          selfPayOnDelivery: info.self_pay_on_delivery,
          additional_goodsid_arr: additional_goodsid_arr
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      },
      successStatusAbnormal: function(res) {
        setTimeout(() => {
          wx.navigateBack();
        }, 2000)
      }
    });
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      if (res.express == 0 || res.default_extraction_type == 1){
        this.getSelfDeliveryList();
      }
      this.setData({
        storeConfig: res,
        is_self_delivery: (res.express == 0 || res.default_extraction_type == 1) ? 1 : 0,
        storeStyle: res.color_config
      })
      this.getCalculationInfo();
    },this.franchisee_id);
  },
  remarkInput: function (e) {
    var value = e.detail.value;
    if(value.length  > 30){
      app.showModal({
        content: '最多只能输入30个字'
      });
      value = value.slice(0, 30);
    }

    this.setData({
      orderRemark: value
    });
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function(e){
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if(+goods.num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if(this.data.limit_buy !== '' && +goods.num >= this.data.limit_buy) return;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    var goods = this.data.goodsList[index],
        currentNum = +goods.num,
        targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
        _this = this,
        data = {},
        param;

    if(targetNum == 0 && type == 'minus'){
      app.showModal({
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: function(){
          _this.cart_data_arr[index].num = targetNum;
          data['goodsList['+index+'].num'] = targetNum;
          _this.setData(data);
          _this.deleteGoods(index);
        }
      })
      return;
    }

    param = {
      goods_id: goods.goods_id,
      model_id: goods.model_id || '',
      num: targetNum,
      sub_shop_app_id: _this.franchisee_id,
      is_seckill : goods.is_seckill == 1 ? 1 : ''
    };
    if(this.data.is_group){
      param.is_group_buy = this.data.is_group ? 1 : 0;
      param.num_of_group_buy_people = this.data.group_buy_people;
      param.team_token = this.data.teamToken;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res){
        _this.cart_data_arr[index].num = targetNum;
        data['goodsList['+index+'].num'] = targetNum;
        data.selectDiscountInfo = '';
        data.exchangeCouponData = {
          dialogHidden: true,
          hasSelectGoods: false,
          voucher_coupon_goods_info: { }
        };
        _this.setData(data);
        _this.getCalculationInfo();
      },
      fail: function(res){
        data = {};
        _this.cart_data_arr[index].num = currentNum;
        data['goodsList['+index+'].num'] = currentNum;
        _this.setData(data);
      }
    })
  },
  deleteGoods: function(index){
    var goodsList = this.data.goodsList,
        _this = this,
        listExcludeDelete;

    app.sendRequest({
      url : '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [this.cart_data_arr[index].cart_id],
        sub_shop_app_id: this.franchisee_id
      },
      success: function(res){
        (listExcludeDelete = goodsList.concat([])).splice(index, 1);
        if(listExcludeDelete.length == 0){
          app.turnBack();
          return;
        }

        var deleteGoodsId = goodsList[index],
            noSameGoodsId = true;

        for (var i = listExcludeDelete.length - 1; i >= 0; i--) {
          if(listExcludeDelete[i].id == deleteGoodsId){
            noSameGoodsId = false;
            break;
          }
        }
        if(noSameGoodsId){
          let a =  delete _this.data.additional_info[deleteGoodsId];
          _this.setData({
            additional_info: a
          })
        }
        _this.cart_data_arr.splice(index, 1);
        _this.setData({
          goodsList: listExcludeDelete,
          selectDiscountInfo: '',
          exchangeCouponData: {
            dialogHidden: true,
            hasSelectGoods: false,
            voucher_coupon_goods_info: {}
          }
        })
        _this.getCalculationInfo();
      }
    });
  },
  confirmPayment: function(e){
    var list = this.data.goodsList,
        _this = this,
        selected_benefit = this.data.selectDiscountInfo;
        // hasWritedAdditionalInfo = false;

    if(this.data.is_self_delivery == 0 && !this.data.selectAddress.id){
      app.showModal({
        content: '请完善地址信息',
        confirmText: '去填写',
        confirmColor: _this.data.storeStyle.theme,
        confirm: function () {
          _this.goToMyAddress();
        }
      });
      return;
    }

    if (this.data.is_self_delivery == 1 && !this.data.selectDelivery.id) {
      app.showModal({
        content: '请选择上门自提地址',
        confirmText: '去填写',
        confirmColor: _this.data.storeStyle.theme,
        confirm: function () {
          _this.toDeliveryList();
        }
      });
      return;
    }

    if (this.data.hasRequiredSuppInfo && !this.data.deliverydWrite && !this.data.aloneDeliveryShow){
      app.showModal({
        content: '商品补充信息未填写，无法进行支付',
        confirmText: '去填写',
        confirmColor: _this.data.storeStyle.theme,
        confirm: function(){
          _this.goToAdditionalInfo();
        }
      });
      return;
    }

    if (this.data.aloneDeliveryShow){
      let a = this.data.additional_info;
      let id = this.data.additional_goodsid_arr[0];
      if (a[id][0].is_required == 0 && a[id][0].value == ''){
        app.showModal({
          content: '请填写' + a[id][0].title,
          confirmText: '确认',
          confirmColor: _this.data.storeStyle.theme,
        });
        return;
      }
    }

    if(this.requesting){
      return;
    }
    this.requesting = true;

    app.sendRequest({
      url : '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        cart_arr: this.cart_data_arr,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id,
        selected_benefit: selected_benefit,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        self_delivery_app_store_id: this.data.is_self_delivery == 1 ? this.data.selectDelivery.id: '',
        remark: this.data.orderRemark,
        address_id: this.data.selectAddress.id,
        additional_info: this.data.additional_info,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        is_pay_on_delivery: this.data.cashOnDelivery ? 1 : 0
      },
      success: function(res){
        if (_this.data.cashOnDelivery){
          let pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + res.data + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '');
          app.turnToPage(pagePath, 1);
        }else{
          _this.payOrder(res.data);
        }
      },
      fail: function(){
        _this.requesting = false;
      },
      successStatusAbnormal: function(){
        _this.requesting = false;
      }
    });
  },
  payOrder: function(orderId){
    var _this = this;

    function paySuccess() {
      var pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + orderId + (_this.franchisee_id ? '&franchisee='+_this.franchisee_id : '') + '&is_group=' + !!_this.is_group;
      if(!_this.franchisee_id){
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            'order_id': orderId,
            sub_app_id: _this.franchisee_id
          },
          success: function(res){
            if(res.valid == 0) {
              pagePath += '&collectBenefit=1';
            }
            app.turnToPage(pagePath, 1);
          }
        });
      } else {
        app.turnToPage(pagePath, 1);
      }
    }

    function payFail(){
      if(_this.is_group){
        if(_this.data.teamToken){
          app.turnBack();
          return;
        }
        app.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      }else{
        app.turnToPage('/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      }
    }

    if(this.data.totalPayment == 0){
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          paySuccess();
        },
        fail: function(){
          payFail();
        },
        successStatusAbnormal: function () {
          payFail();
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
        var param = res.data;

        param.orderId = orderId;
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        _this.wxPay(param);
      },
      fail: function(){
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  wxPay: function(param){
    var _this = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      success: function(res){
        app.wxPaySuccess(param);
        param.success();
      },
      fail: function(res){
        if(res.errMsg === 'requestPayment:fail cancel'){
          app.showModal({
            content: '支付已取消',
            complete: param.fail
          })
          return;
        }
        app.showModal({
          content: '支付失败',
          complete: param.fail
        })
        app.wxPayFail(param, res.errMsg);
      }
    })
  },
  goToMyAddress: function () {
    var addressId = this.data.selectAddress.id;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
  },
  useBalanceChange: function(e){
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  useCashDelivery: function(e){
    if (this.data.selfPayOnDelivery == 0 && e.detail.value) {
      this.setData({
        is_self_delivery: false
      })
    }
    this.setData({
      cashOnDelivery: e.detail.value
    })
  },
  deliveryWayChange: function(event){
    let type = event.currentTarget.dataset.type;
    if (this.data.selfPayOnDelivery == 0 && type){
      this.setData({
        cashOnDelivery: false
      })
    }
    if (type == 1 && !this.data.selectDelivery){
      this.getSelfDeliveryList();
    }
    this.setData({
      is_self_delivery: type
    })
    this.getCalculationInfo();
  },
  goToAdditionalInfo: function(){
    app.setGoodsAdditionalInfo(this.data.additional_info);
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
  },
  exchangeCouponInit: function(id){
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: id
      },
      success: function (res) {
        var goods = res.data[0].form_data;
        var goodsModel = [];
        var selectModelInfo = {
          'models': [],
          'price': 0,
          'modelId': '',
          'models_text': '',
          'imgurl': ''
        };
        if(goods.model_items.length){
          // 有规格
          selectModelInfo['price'] = Number(goods.model_items[0].price);
          selectModelInfo['imgurl'] = goods.model_items[0].img_url;
          selectModelInfo['modelId'] = goods.model_items[0].id;
        } else {
          selectModelInfo['price'] = Number(goods.price);
          selectModelInfo['imgurl'] = goods.cover;
        }
        for(var key in goods.model){
          if(key){
            goodsModel.push(goods.model[key]); // 转成数组
            selectModelInfo['models'].push(goods.model[key].subModelId[0]);
            selectModelInfo['models_text'] += '“' + goods.model[key].subModelName[0] + '” ';
          }
        }
        goods.model = goodsModel; // 将原来的结构转换成数组
        _this.setData({
          'exchangeCouponData.dialogHidden': false, // 显示模态框
          'exchangeCouponData.goodsInfo': goods,
          'exchangeCouponData.selectModelInfo': selectModelInfo
        });
      },
      successStatusAbnormal: function(){
        app.showModal({
          content: '兑换的商品已下架'
        });
      }
    });
  },
  exchangeCouponHideDialog: function(){
    this.setData({
      selectDiscountInfo: {
        title: "不使用优惠",
        name: '无',
        no_use_benefit: 1
      },
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  exchangeCouponSelectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.exchangeCouponData.selectModelInfo.models,
        model = this.data.exchangeCouponData.goodsInfo.model,
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
    data['exchangeCouponData.selectModelInfo.models'] = selectModels;
    data['exchangeCouponData.selectModelInfo.models_text'] = text;

    this.setData(data);
    this.exchangeCouponResetSelectCountPrice();
  },
  exchangeCouponResetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.exchangeCouponData.selectModelInfo.models.join(','),
        modelItems = this.data.exchangeCouponData.goodsInfo.model_items,
        data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        data['exchangeCouponData.selectModelInfo.stock'] = modelItems[i].stock;
        data['exchangeCouponData.selectModelInfo.price'] = modelItems[i].price;
        data['exchangeCouponData.selectModelInfo.modelId'] = modelItems[i].id;
        data['exchangeCouponData.selectModelInfo.imgurl'] = modelItems[i].img_url;
        break;
      }
    }
    this.setData(data);
  },
  exchangeCouponConfirmGoods: function(){
    let _this = this;
    let goodsInfo = _this.data.exchangeCouponData.goodsInfo;
    let model = goodsInfo.model;
    let selectModels = _this.data.exchangeCouponData.selectModelInfo.models;
    let model_value_str = '';
    if(selectModels.length > 0){
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if( selectModels[i] == selectSubModelId[j] ){
            model_value_str += model[i].subModelName[j] + '； ';
          }
        }
      }
    }
    goodsInfo['model_value_str'] = model_value_str;
    _this.setData({
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.selectModelInfo': {},
      'exchangeCouponData.hasSelectGoods': true,
      'exchangeCouponData.voucher_coupon_goods_info': {
        goods_id: goodsInfo.id,
        num: 1,
        model_id: _this.data.exchangeCouponData.selectModelInfo.modelId
      },
      'exchangeCouponData.goodsInfo': goodsInfo
    });
    _this.getCalculationInfo();
  },
  inputGoodsCount: function (e) {
    let value = +e.detail.value;
    let index = e.target.dataset.index;

    if (isNaN(value) || value <= 0) {
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.changeGoodsNum(index, value);
    }, 500);
  },
  toDeliveryList: function (){
    let _this = this;
    let url = '';
    if (_this.franchisee_id){
      url += '?franchiseeId=' + _this.franchisee_id;
      url += _this.data.selectDelivery.id ? '&deliveryId=' + _this.data.selectDelivery.id : '';
    }else{
      url += _this.data.selectDelivery.id ? '?deliveryId=' + _this.data.selectDelivery.id : '';
    }
    app.turnToPage('/eCommerce/pages/goodsDeliveryList/goodsDeliveryList' + url);
  },
  showMemberDiscount: function(){
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function(event){
    this.setData({
      selectDiscountInfo: event.detail.selectedDiscount,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}  
    })
    this.getCalculationInfo();
  },
  getSuppInfo: function (suppInfoArr) {
    var _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr
      },
      success: function (res) {
        for (let i = 0; i < res.data.length; i++) {
          let suppInfo = res.data[i].delivery_info;
          for (let j = 0; j < suppInfo.length; j++) {
            if (suppInfo[j].is_required == 0 && suppInfo[j].is_hidden == 1) {
              _this.setData({
                hasRequiredSuppInfo: true
              })
            }
            if (suppInfo[j].is_hidden == 1){
              _this.setData({
                noAdditionalInfo: false
              })
            }
          }
        }
        // 单商品单补充信息时直接展示
        if (res.data.length == 1 && _this.data.additional_goodsid_arr.length == 1){
          let deliveryIndex = 0;
          let showIndex = 0;
          for (let i = 0; i < res.data[0].delivery_info.length; i++){
            if (res.data[0].delivery_info[i].is_hidden == 1) {
              deliveryIndex++;
              showIndex = i;
            }
          }
          if (deliveryIndex == 1){
            let data = {};
            data[_this.data.additional_goodsid_arr[0]] = [];
            data[_this.data.additional_goodsid_arr[0]].push({
              title: res.data[0].delivery_info[showIndex].name,
              type: res.data[0].delivery_info[showIndex].type,
              is_required: res.data[0].delivery_info[showIndex].is_required,
              value: ''
            })
            _this.setData({
              additional_info: data,
              aloneDeliveryShow: true
            })
          }
        }
      }
    })
  },
  getSelfDeliveryList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      data: {
        sub_shop_app_id: _this.franchisee_id,
      },
      success: function (res) {
        if (res.data.store_list_data && res.data.store_list_data.length == 1)
        _this.setData({
          selectDelivery: res.data.store_list_data[0]
        })
      }
    })
  },
  // 补充信息
  inputFormControl: function (e) {
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    a[b][0].value = e.detail.value
    this.setData({
      additional_info: a
    })
  },
  addDeliveryImg: function () {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let images = a[b][0].value || [];

    app.chooseImage((image) => {
      a[b][0].value = images.concat(image);
      _this.setData({
        additional_info: a
      })
    }, 9)
  },
  deleteImage: function (e) {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let index = e.currentTarget.dataset.imageIndex;
    let images = a[b][0].value;

    images.splice(index, 1);
    a[b][0].value = images;
    _this.setData({
      additional_info: a
    })
  }
})
