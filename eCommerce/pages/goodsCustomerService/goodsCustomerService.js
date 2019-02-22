
var app = getApp()

Page({
  data: { 
    orderStatus: ['待审核', '退款失败', '退款失败', '退货中', '待商家确认收货', '退款失败', '退款成功', '退款失败'],
    orderReason: ['待审核', '商家拒绝退款', '买家撤销退款', '待买家退货', '待商家确认收货', '商家超时未退货', '已退款', '商家超时未处理退款'],
    refundType: ['全额退款', '部分退款','退货退款'],
    orderInfo: []
  },
  page: 1,
  isMore: 0,
  onLoad: function () {
  },
  onShow: function () {
    this.dataInitial();
  },
  dataInitial: function () {
    this.setData({
      orderInfo: []
    })
    this.page = 1;
    this.getAfterSaleOrderList();
  },
  onReachBottom: function(){
    if (!this.isMore){return};
    this.page++;
    this.getAfterSaleOrderList();
  },
  getAfterSaleOrderList: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAfterSaleOrderList',
      method: 'post',
      data: {
        page: _this.page,
        page_size: 10
      },
      success: function (res) {
        _this.isMore = res.is_more;
        let orderInfo = _this.data.orderInfo.concat(res.data);
        _this.setData({
          orderInfo: orderInfo
        })
      }
    })
  },
  toGoodsOrderDetail: function(event){
    let orderId = event.currentTarget.dataset.orderId;
    let franchiseeId = event.currentTarget.dataset.franchiseeId;
    let applyId = event.currentTarget.dataset.applyId;
    franchiseeId = franchiseeId != app.getAppId() ? franchiseeId : '';
    let router = '/eCommerce/pages/goodsAfterSaleDetail/goodsAfterSaleDetail?applyId=' + applyId +'&detail=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(router);
  },
  deleteAfterSale: function(event){
    let orderId = event.currentTarget.dataset.orderId;
    let applyId = event.currentTarget.dataset.applyId;
    let index = event.currentTarget.dataset.index;
    let _this = this;
    app.showModal({
      content: '确认删除记录？',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/deleteAfterSaleOrderLog',
          method: 'post',
          data: {
            order_id: orderId,
            apply_id: applyId
          },
          success: function (res) {
            let orderInfo = _this.data.orderInfo;
            orderInfo.splice(index,1);
            _this.setData({
              orderInfo: orderInfo
            })
          }
        })
      }
    })    
  },
  cancelRefund: function (event) {
    let _this = this;
    let parentId = event.currentTarget.dataset.parentId;
    let orderId = event.currentTarget.dataset.orderId;
    let franchiseeId = parentId ? app.getAppId() : '';
    app.showModal({
      content: '确认撤销申请？',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=appShop/cancelRefund',
          data: {
            'order_id': orderId,
            'sub_shop_app_id': franchiseeId
          },
          success: function () {
            _this.dataInitial();
          }
        })
      }
    })
  },
  refuseReason: function(event){
    let reason = event.currentTarget.dataset.reason;
    app.showModal({
      content: reason
    })
  }
})