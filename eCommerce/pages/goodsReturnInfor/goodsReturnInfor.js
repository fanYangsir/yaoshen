
var app = getApp()

Page({
  data: {
    goodsList: [],
    imagesArr: [],
    refundDes: '',
    shipment: '',
    phone: ''
  },
  applyId: '',
  orderId: '',
  franchiseeId: '',
  refundGoods: [],
  expressList: [],
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee;
    this.dataInitial();
  },
  onShow: function () {
    
  },
  dataInitial: function () {
    this.getOrderDetail();
    this.expressList();
    this.getAppECStoreConfig();
    this.setData({
      phone: app.getUserInfo().phone || ''
    })
  },
  getOrderDetail: function (orderId) {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: this.franchiseeId
      },
      success: function (res) {
        _this.applyId = res.data[0].form_data.refund_apply.id;
        _this.setData({
          goodsList: res.data[0].form_data.refund_apply.refund_goods
        })
      }
    })
  },
  chooseImage: function () {
    let _this = this;
    let img_arr = _this.data.imagesArr;

    app.chooseImage(function (images) {
      let data = {};
      data.imagesArr = img_arr.concat(images);
      _this.setData(data);
    },9);
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
  cancelRefund: function () {
    app.turnBack();
  },
  stopPropagation: function (event) {
  },
  inputRefundDes: function (event){
    this.setData({
      refundDes: event.detail.value
    })
  },
  shipmentNumber: function (event){
    this.setData({
      shipment: event.detail.value
    })
  },
  phoneNumber: function(event){
    this.setData({
      phone: event.detail.value
    })
  },
  sureSubmit: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/updateRefundApply',
      method: 'post',
      data: {
        sub_shop_app_id: this.franchiseeId,
        apply_id: _this.applyId,
        form_data: {
          express_code: _this.data.expressList[_this.data.expressIndex].code,
          express_no: _this.data.shipment,
          phone: _this.data.phone,
          description: _this.data.refundDes,
          img_url: _this.data.imagesArr
        }
      },
      success: function (res) {
        app.turnBack();
      }
    })
  },
  expressList: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/expressList',
      data: {
        page: -1,
      },
      success: function (res) {
        _this.setData({
          expressList: res.data
        })
      }
    })
  },
  selectExpress: function(event){
    this.setData({
      expressIndex: event.detail.value
    })
  },
  scanLogisticsNumber: function(){
    let _this = this;
    wx.scanCode({
      success: function (res) {
        _this.setData({
          shipment: res.result
        })
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hasRecommendConfig: res.recommend_config ? true : false
      })
    }, this.franchiseeId);
  }
})