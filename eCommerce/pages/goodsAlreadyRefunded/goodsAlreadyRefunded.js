var app = getApp();

Page({
  data: {
    alreadyGoods: []
  },
  onLoad: function () {
    this.dataInitial();
  },
  onShow: function () {
    
  },
  dataInitial: function(){
    this.getAlreadyGoods();
  },
  getAlreadyGoods: function(){
    let alreadyGoods = getCurrentPages()[getCurrentPages().length - 2].data.orderInfo.goods_info;
    let refundPrice = getCurrentPages()[getCurrentPages().length - 2].data.orderInfo.refunded_price;
    this.setData({
      alreadyGoods: alreadyGoods,
      refundPrice: refundPrice
    })
  }
})