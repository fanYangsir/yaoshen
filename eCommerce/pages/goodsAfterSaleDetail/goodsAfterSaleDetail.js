
var app = getApp()

Page({
  data: {
    orderReason: ['商家待审核', '商家拒绝退款', '买家撤销退款', '待买家退货', '待商家确认收货', '卖家超时未退货', '已退款', '商家超时未处理退款'],
    refundReason: ['多拍/拍错/不想要','快递延期','未按约定时间发货','快递记录出错','内容与描述不符','其它'],
    orderIcon: [ 'goods-undone-payment', 'goods-refund-doing', 'goods-refund-doing' , 'goods-refund', 'goods-undone-receipt', 'goods-refund-doing', 'goods-already-refund', 'goods-refund-doing' ],
    orderId: '',
    showEventDialog: false,
    eventType: '',
  },
  isFromBack: false,
  applyId: '',
  onLoad: function (options) {
    this.applyId =  options.applyId;
    this.franchiseeId = options.franchisee || '';
    this.setData({
      orderId: options.detail
    })
    this.dataInitial();
  },
  onShow: function () {
    if (this.isFromBack) {
      this.getAfterSaleOrder();
    } else {
        this.isFromBack = true;
    }
  },
  // 每个页面数据初始化函数 dataInitial
  dataInitial: function () {
    this.getAfterSaleOrder();
    this.getAppECStoreConfig();
  },
  getAfterSaleOrder: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getAfterSaleOrder',
      data: {
        apply_id: _this.applyId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        _this.setData({
          afterSaleData: res.data
        });
      }
    })
  },
  orderDelete: function (e) {
    let orderId = this.data.orderId;
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteAfterSaleOrderLog',
      method: 'post',
      data: {
        order_id: orderId,
        apply_id: _this.applyId
      },
      success: function (res) {
        app.turnBack()
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
  editorRefund: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsRefundPage/goodsRefundPage?type=editor&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  checkLogistics: function () {
    let applyId = this.applyId;
    let franchiseeId = this.franchiseeId;
    app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?applyId=' + applyId + '&form=afterSale' + (franchiseeId ? '&franchiseeId=' + franchiseeId : ''));
  },
  copyOrderId: function(){
    let _this = this;
    wx.setClipboardData({
      data: _this.data.orderId,
      success: function (res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  hideEventDialog: function () {
    this.setData({
      showEventDialog: false
    })
  },
  showEventDialog: function (event){
    this.setData({
      eventType: event.currentTarget.dataset.type,
      showEventDialog: true
    })
  },
  goOrderProgress: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderProgress/goodsOrderProgress?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  returnInfor: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsReturnInfor/goodsReturnInfor?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        refundAdress: res.refund_config.address
      })
    }, this.franchiseeId);
  },
  cancelRefund: function () {
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=appShop/cancelRefund',
      data: {
        'order_id': orderId,
        'sub_shop_app_id': franchiseeId
      },
      success: function () {
        _this.getAfterSaleOrder();
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
})
