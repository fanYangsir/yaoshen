// Collage/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    activityType: 0,
    autoRefund: '',
    refundMode: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var _this = this,
    titleType = '';
    _this.getPlayMessage();
    _this.setData({
      activityType: options.activityType,
      autoRefund: options.autoRefund,
      refundMode: options.refundMode
    })
    switch(options.activityType){
      case "0":
        titleType = '';
        break;
      case "1": 
        titleType = '新人团';
        break;
      case "2":
        titleType = '阶梯团';
        break;
      case "3": 
        titleType = '帮帮团';
        break;
      case "4":
        titleType = '抽奖团';
        break;
    };
    wx.setNavigationBarTitle({
      title: titleType  + '拼团须知'
    })
  },
  getPlayMessage() {
  
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})