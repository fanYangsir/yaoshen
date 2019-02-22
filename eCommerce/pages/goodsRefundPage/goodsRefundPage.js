
var app = getApp()

Page({
  data: {
    orderInfoStatus: '',
    goodsList: [],
    refundTypeData: [{ 'title': '未收到货物/拒收货物（申请全额退款）'},
      { 'title': '已收到货物，不退货，仅退款（申请部分退款）'},
      { 'title': '已收到货物，退货退款（申请退货退款）'}],
    refundReasonData: [{ 'title': '多拍/拍错/不想要'},
      { 'title': '快递延期'},
      { 'title': '未按约定时间发货'},
      { 'title': '快递记录出错'},
      { 'title': '内容与描述不符'},
      { 'title': '其它'}],
    refundWayData: [{ 'title': '原付款方式退回'},
      { 'title': '退还为储值金'}],
    showRefundType: true,
    showRefundReason: true,
    showRefundWay: true,
    typeIndex: '',
    reasonIndex: '',
    wayIndex: '',
    imagesArr: [],
    express: '',
    maxRefundPrice: '',
    refundPrice: '',
    refundDes: '',
  },
  orderId: '',
  franchiseeId: '',
  origin: '',
  applyRefundId: '',
  refundGoods: [],
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee || '';
    this.origin = options.type;
    this.dataInitial();
  },
  onShow: function () {
    
  },
  dataInitial: function () {
    this.getAppECStoreConfig();
    if (this.origin == 'apply'){
      let data = getCurrentPages()[getCurrentPages().length - 2].data.goodsList;
      let goodsList = [];
      let refundGoods = [];
      for (let i = 0; i < data.length;i++){
        if (data[i].selected){
          goodsList.push(data[i]);
          refundGoods.push({
            goods_id: data[i].goods_id,
            model_id: data[i].model_id,
            num: data[i].preview_refund_num
          })
        }
      }
      this.setData({
        goodsList: goodsList
      })
      this.refundGoods = refundGoods;
      this.calculateRefundPrice();
    }
    this.getOrderDetail();
  },
  getOrderDetail: function () {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        if (_this.origin == 'editor'){
          let refundGoods = res.data[0].form_data.refund_apply.refund_goods;
          for (let j = 0; j < refundGoods.length; j++) {
            refundGoods[j].goods_name = refundGoods[j].title;
            refundGoods[j].preview_refund_num = refundGoods[j].num;
            refundGoods[j].model_value = refundGoods[j].model_name;
          }
          _this.setData({
            goodsList: refundGoods,
            typeIndex: res.data[0].form_data.refund_apply.refund_type,
            reasonIndex: res.data[0].form_data.refund_apply.refund_reason,
            wayIndex: res.data[0].form_data.refund_apply.refund_mode,
            imagesArr: res.data[0].form_data.refund_apply.img_url || [],
            refundDes: res.data[0].form_data.refund_apply.description,
            refundPrice: res.data[0].form_data.refund_apply.refund_price
          })
          _this.applyRefundId = res.data[0].form_data.refund_apply.id;
          _this.refundGoods = refundGoods;
          _this.calculateRefundPrice();
        }
        _this.setData({
          orderInfoStatus: res.data[0].form_data.status,
          is_group_buy_order: res.data[0].form_data.is_group_buy_order || 0
        })
      }
    })
  },
  calculateRefundPrice: function(type){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/calculateRefundPrice',
      method: 'post',
      data: {
        order_id: _this.orderId,
        refund_goods: _this.refundGoods,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let newData = {
          express: res.data.has_express,
          maxRefundPrice: res.data.refund_goods_price
        };
        _this.origin == 'editor' ? '' : newData['refundPrice'] = res.data.refund_goods_price;
        _this.setData(newData);
      }
    })
  },
  closeRefundBox: function () {
    this.setData({
      showRefundType: true,
      showRefundReason: true,
      showRefundWay: true
    })
  },
  showRefundBox: function (event) {
    let _this = this;
    let type = event.currentTarget.dataset.type;
    let newData = {};
    switch(type){
      case 'type': 
        newData.showRefundType = false;
        break;
      case 'reason':
        if (_this.data.typeIndex !== ''){
          newData.showRefundReason = false;
        }
        break;
      case 'way':
        if (_this.data.typeIndex !== '' && _this.data.reasonIndex !== '') {
          newData.showRefundWay = false;
        }
        break;
    }
    this.setData(newData)
  },
  selectReason: function (event) {
    let type = event.currentTarget.dataset.type;
    let index = event.currentTarget.dataset.index;
    let newData = {};
    let _this = this;
    switch (type){
      case 'type':
        newData.typeIndex = index;
        if (index == 0){
          newData.refundPrice = _this.data.maxRefundPrice;
        }
        newData.showRefundType = true;
        newData.showRefundReason = false;
        break;
      case 'reason':
        newData.reasonIndex = index;
        newData.showRefundReason = true;
        newData.showRefundWay = false;
        break;
      case 'way':
        newData.wayIndex = index;
        newData.showRefundWay = true
        break;  
    }
    this.setData(newData);
  },
  chooseImage: function () {
    let _this = this;
    let img_arr = _this.data.imagesArr || [];

    app.chooseImage(function (images) {
      let data = {};
      data.imagesArr = img_arr.concat(images);
      _this.setData(data);
    }, 8 - img_arr.length);
  },
  deleteImage: function (event) {
    let picIndex = event.currentTarget.dataset.index;
    let img_arr = this.data.imagesArr;
    let data = {};

    img_arr.splice(picIndex, 1);
    data.imagesArr = img_arr;
    this.setData(data);
  },
  previewImage: function (event){
    let _this = this;
    let index = event.currentTarget.dataset.index;
    app.previewImage({
      current: _this.data.imagesArr[index],
      urls: _this.data.imagesArr
    })
  },
  prevRefundBox: function (event) {
    let type = event.currentTarget.dataset.type;
    let newData = {};
    switch(type){
      case 'reason':
        newData.showRefundType = false;
        newData.showRefundReason = true;
        break;
      case 'way':
        newData.showRefundReason = false;
        newData.showRefundWay = true;
        break;
    }
    this.setData(newData);
  },
  cancelRefund: function () {
    app.turnBack();
  },
  stopPropagation: function (event) {
  },
  changeRefundPrice: function (event) {
    this.setData({
      refundPrice: event.detail.value
    })
  },
  inputRefundDes: function (event){
    this.setData({
      refundDes: event.detail.value
    })
  },
  sureRefund: function(){
    let _this = this;
    if (_this.data.typeIndex === ''){
      app.showModal({
        content: '请填写退款类型'
      })
      return;
    }
    if (_this.data.reasonIndex === '') {
      app.showModal({
        content: '请填写退款原因'
      })
      return;
    }
    if (_this.data.wayIndex === '') {
      app.showModal({
        content: '请填写退款方式'
      })
      return;
    }
    if (_this.data.refund_price <= 0) {
      app.showModal({
        content: '退款金额有误'
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=appShop/applyRefund',
      method: 'post',
      data: {
        sub_shop_app_id: _this.franchiseeId,
        apply_id: _this.applyRefundId,
        order_id: _this.orderId,
        refund_price: _this.data.refundPrice,
        refund_goods: _this.refundGoods,
        refund_type: _this.data.typeIndex,
        refund_reason: _this.data.reasonIndex,
        refund_mode: _this.data.wayIndex,
        description: _this.data.refundDes.replace(/\n|\r\n/g, '<br />'),
        img_url: _this.data.imagesArr
      },
      success: function (res) {
        if (_this.origin == 'apply'){
          app.turnBack({
            delta: 2
          });
        }else{
          app.turnBack();
        }
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        refundWithGoods: res.refund_config.refund_with_goods,
        isFullRefund: res.refund_config.is_full_refund,
        refundTobalance: res.refund_config.refund_to_balance,
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  }
})