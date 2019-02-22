
var app = getApp()

Page({
  data: {
    goodsList: [],
    selectAll: true,
  },
  orderId: '',
  franchiseeId: '',
  onLoad: function(options){
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee;
    this.getOrderDetail();
  },
  onShow: function(){
    this.getAppECStoreConfig();
  },
  getOrderDetail: function () {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let goodsData = res.data[0].form_data.goods_info;
        for (let i = 0; i < goodsData.length;i++){
          goodsData[i].preview_refund_num = goodsData[i].num - (goodsData[i].refunded_num || '0');
          goodsData[i].preview_refund_num > 0 && goodsData[i].is_benefit_goods != 1 ? goodsData[i].selected = true : '';
          goodsData[i].model_value_str = goodsData[i].model_value ? goodsData[i].model_value.join('； ') : '';
        }
        _this.setData({
          goodsList: goodsData,
          is_group_buy_order: res.data[0].form_data.is_group_buy_order || 0
        })
      }
    })
  },
  clickSelectAll: function(){
    var alreadySelect = this.data.selectAll,
        list = this.data.goodsList;

    if(alreadySelect){
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].selected = false;
      }
    } else {
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].selected = true;
      }
    }
    this.setData({
      selectAll: !alreadySelect,
      goodsList: list
    })
  },
  clickSelectGoods: function(e){
    var index = e.currentTarget.dataset.index,
        list = this.data.goodsList,
        selectAll = true;

    list[index].selected = !list[index].selected;
    for (var i = list.length - 1; i >= 0; i--) {
      if(!list[i].selected){
        selectAll = false;
        break;
      }
    }
    this.setData({
      goodsList: list,
      selectAll: selectAll
    })
  },
  sureRefund: function() {
    let orderId = this.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsRefundPage/goodsRefundPage?type=apply&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    let goodsList = this.data.goodsList;
    let flag = true;
    for (let i = 0; i < goodsList.length;i++){
      if (goodsList[i].selected){
        flag = false;
      }
    }
    if(flag){
      app.showModal({
        content: '请选择需要退款的商品'
      })  
      return
    }
    app.turnToPage(pagePath);
  },
  clickMinusButton: function(e){
    let index = e.currentTarget.dataset.index;
    let previewRefundNum = this.data.goodsList[index].preview_refund_num;
    if (previewRefundNum - 1 <= 0){return};
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    let index = e.currentTarget.dataset.index;
    let previewRefundNum = this.data.goodsList[index].preview_refund_num;
    let maxRefundNum = this.data.goodsList[index].num - (this.data.goodsList[index].refunded_num || '0');
    if (previewRefundNum + 1 > maxRefundNum){return};
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    let canRefundNum = this.data.goodsList[index].preview_refund_num;
    let targetNum = type == 'plus' ? canRefundNum + 1 : canRefundNum - 1;
    let data = {};
    
    data['goodsList[' + index + '].preview_refund_num'] = targetNum;
    this.setData(data);

  },
  inputGoodsCount: function(e){
    let index = e.target.dataset.index;
    let previewRefundNum = e.detail.value;
    let data = {};
    let maxRefundNum = this.data.goodsList[index].num - (this.data.goodsList[index].refunded_num || '0');
    if (previewRefundNum == '') {return;}
    if (previewRefundNum == 0) {
      app.showModal({
        content: '请输入大于0的数字',
      })
      return;
    }
    if (previewRefundNum > maxRefundNum){
      app.showModal({
        content: '当前输入数量大于可退款数量',
      })
      return;
    }
    data['goodsList[' + index + '].preview_refund_num'] = previewRefundNum;
    this.setData(data);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
})
