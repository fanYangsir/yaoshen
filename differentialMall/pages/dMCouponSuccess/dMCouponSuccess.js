const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    merchantId: '',
    couponId: '',
    userCouponId: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let merchantId = options && options.mId, // 商家id
      couponId = options && options.cId, // 优惠券id
      userCouponId = options && options.uId;
    
    this.setData({
      merchantId: merchantId,
      couponId: couponId,
      userCouponId: userCouponId
    });
  },
  /**
   * 页面跳转
   */
  turnToPage: function (e) {
    let datasetObj = e.currentTarget.dataset;
    // 跳转url
    let url = datasetObj.url;
    // 是否redirect
    let isRedirect = datasetObj.isRedirect === 'false' ? false : true;
    if (url) {
      app.turnToPage(url, isRedirect);
    }
  },
})