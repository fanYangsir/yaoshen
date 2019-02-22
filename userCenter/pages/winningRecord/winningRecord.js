var app = getApp();
Page({
  data:{
        currentTabIndex:1,
        myPrizeList:[]
  },
  onLoad: function (options) {
    this.setData({
      franchisee: options.franchisee || ''
    });
  },
  onShow:function(options){
    var that=this;
    
    that.getMyPrizeCenter(1);
    this.getAppECStoreConfig();
  },
  clickTap:function(e){
    var that=this;
    var index=e.currentTarget.dataset.index,
       data={};
       data.currentTabIndex=index;
       that.setData(data);
       that.getMyPrizeCenter(index);

  },
  getMyPrizeCenter: function (category){
    var that=this;
    app.sendRequest({
      url:'/index.php?r=appLotteryActivity/myPrizeCenter',
      method:'post',
      data:{
        category: category,
        page: 1, 
        page_size: 999,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        that.setData({
          myPrizeList: res.data
        })
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.data.franchisee);
  },
})