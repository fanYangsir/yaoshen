var app = getApp()

Page({
  data: {
    
  },
  orderId: '',
  onLoad: function (options) {
    if(options.pageFrom != 'transation'){
      app.setPageTitle('评价成功');
    }
    this.orderId = options.orderId;
    this.setData({
      franchiseeId: options.franchiseeId || '',
      pageFrom: options.pageFrom
    })
  },
  onShow: function(){
    this.getAppECStoreConfig();
  },
  goToHomepage: function () {
    let router = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + router + '/' + router
    });
  },
  goToComment: function () {
    app.turnToPage('/eCommerce/pages/makeComment/makeComment?detail=' + this.orderId + '&franchisee=' + this.data.franchiseeId, 1);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hasRecommendConfig: res.recommend_config ? true : false
      })
    }, this.data.franchiseeId);
  }
})