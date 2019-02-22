
var app = getApp()

Page({
  data: {
    vipList: []
  },
  onLoad: function(){
    this.getVIPCardList();
  },
  // 获取会员卡数据
  getVIPCardList: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetUserVIPCardList',
      data: {
        'parent_app_id': app.getAppId()
      },
      success: function (res) {
        that.setData({
          vipList: res.data
        });
      },
      complete: function () {

      }
    });
  },
  // 跳转详情
  turnToVipCard: function(e){
    let id = e.currentTarget.dataset.id;
    let appid = e.currentTarget.dataset.appid;
    let isPaidCard = e.currentTarget.dataset.ispaidcard;

    app.turnToPage('/eCommerce/pages/vipCard/vipCard?detail=' + id + '&franchisee=' + appid + '&is_paid_vip=' + isPaidCard);
  }
})
