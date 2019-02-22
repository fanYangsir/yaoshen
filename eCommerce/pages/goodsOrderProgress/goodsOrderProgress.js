var app = getApp();

Page({
  data: {
    OrderFlowData: []
  },
  orderId: '',
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.getOrderFlow();
  },
  onShow: function () {
    
  },
  getOrderFlow: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getOrderFlow',
      data: {
        order_id: _this.orderId,
      },
      success: function (res) {
        let OrderFlowData = res.data.reverse ();
        _this.setData({
          OrderFlowData: OrderFlowData
        })
      }
    })
  }
})