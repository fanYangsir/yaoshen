var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {
    couponList: [],
    receiveSuccess: 0,  // 领取成功弹窗是否显示
    receiveCount: 0,    // 已领取数量
    receiveLimitNum: 0, // 领取限制数量
    userInfo: {},
    couponsAndDiscount: {},
    totalUser: 0,
    category: {},
    currentCate: '',
    latitude: '',
    longitude: '',
    isParentShop: false,
    headquartersId: '',
    recvCouponPopFranchisee: false,
    recvCouponPopAppId: '',
    recvCouponPopAppMode: '',
    couponNoMore: false,
    recving: false       // 领取中
  },
  onLoad: function() {
    let that = this;
    let isParent = app.globalData.hasFranchiseeList;
    
    that.setData({
      headquartersId: app.globalData.appId,
      isParentShop: isParent
    });

    if (isParent){
      if (app.isLogin()) {
        that.setData({
          userInfo: app.globalData.userInfo
        });
      } else {
        app.goLogin({
          success: function () {
            that.setData({
              userInfo: app.globalData.userInfo
            });
          }
        });
      }
      that.getLocation();
      that.getCategoryForCoupon();
      that.getDiscountCut();
      that.getTotalUser();
    }else{
      that.getCoupons();
    }
  },
  // 单店时获取优惠券
  getCoupons: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getCoupons',
      data: {
        in_use_date: 1, //0是全部，1是只显示可领取的优惠券
        in_show_list: 1,  //0:不在列表内 1:在列表内
        enable_status: 1, //0:下架 1:上架
        stock: 1,         //0:没有库存的 1:有库存的
        page: -1
      },
      hideLoading: true,
      success: function (res) {
        _this.setData({
          couponList: res.data
        });
      }
    })
  },
  // 跳转优惠券详情(领取状态)
  gotoCouponDetail: function(event){
    let couponId = event.currentTarget.dataset.couponId;
    let appid = event.currentTarget.dataset.appid;
    let franisee = '';
    if (this.data.headquartersId != appid && this.data.isParentShop){
      franisee = '&franchisee=' + appid;
    }
    let url = '/pages/couponDetail/couponDetail?detail=' + couponId + franisee;
    app.turnToPage(url, false);
  },
  // 领取优惠券
  formSubmit: function(event){
    let _this = this,
        couponId = event.currentTarget.dataset.couponId,
        formId = event.detail.formId,
        index = event.currentTarget.dataset.index;

    if(this.data.recving){
      return
    }        
    this.setRecving(true);

    app.sendRequest({
      url: '/index.php?r=AppShop/recvCoupon',
      data: {
        coupon_id: couponId,
        form_id: formId
      },
      hideLoading: true,
      success: function(res) {
        let newdata = {};
        if(res.data.is_already_recv == 1){
          newdata['couponList[' + index + '].recv_status'] = 0;
        }
        newdata['receiveSuccess'] = 1;
        newdata['receiveCount'] = res.data.recv_count;
        newdata['receiveLimitNum'] = res.data.limit_num;
        _this.setData(newdata);
      },
      complete: function () {
        _this.setRecving(false);
      }
    })
  },
  setRecving: function(bool){
    this.setData({
      recving: bool
    })
  },
  // 多商家领取优惠券
  formSubmitFranchisee: function (event) {
    let that = this,
      dataset = event.currentTarget.dataset,
      index = dataset.index,
      formId = event.detail.formId,
      item = that.data.couponList[index],
      couponId = item.id,
      appid = item.app_id,
      mode = item.mode_id;

    if(this.data.recving){
      return
    }   
    this.setRecving(true);    

    app.sendRequest({
      url: '/index.php?r=AppShop/recvCoupon',
      data: {
        coupon_id: couponId,
        form_id: formId,
        sub_app_id: appid
      },
      hideLoading: true,
      success: function (res) {
        let newdata = {};

        if (res.data.is_already_recv == 1) {
          newdata['couponList[' + index + '].recv_status'] = 0;
        }
        newdata['recvCouponPopFranchisee'] = true;
        newdata['recvCouponPopAppId'] = appid;
        newdata['recvCouponPopAppMode'] = mode;
        newdata['couponsAndDiscount.coupons'] = that.data.couponsAndDiscount.coupons + 1;

        that.setData(newdata)
      },
      complete: function () {
        that.setRecving(false);
      }
    })
  },
  // 查看我的优惠券
  gotoCouponList: function(){
    let url = '/eCommerce/pages/couponList/couponList';
    app.turnToPage(url, false);
  },
  // 关闭toast
  hideToast: function(){
    this.setData({
      receiveSuccess: 0,
      receiveCount: 0,
      receiveLimitNum: 0
    });
  },
  stopPropagation: function () {},
  // 获取已节省的金额
  getDiscountCut: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponsAndDiscountCutTotalPrice',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          couponsAndDiscount: res.data
        });
      }
    })
  },
  // 获取正在抢的人数
  getTotalUser: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetTotalUser',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          totalUser: res.data
        });
      }
    })
  },
  // 获取优惠券分类
  getCategoryForCoupon: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCategoryForCoupon',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          category: res.data
        });
      }
    })
  },
  // 获取定位
  getLocation: function(){
    let that = this;
    app.getLocation({
      success: function (res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
        that.getAllShopCouponList();
      },
      fail: function(){
        that.getAllShopCouponList();
      }
    })
  },
  // 获取所有优惠券
  allCouponData: {
    page: 1,
    loading: false,
    nomore: false
  },
  getAllShopCouponList: function(){
    let that = this;

    if (that.allCouponData.loading || that.allCouponData.nomore){
      return;
    }
    that.allCouponData.loading = true;

    app.sendRequest({
      url: '/index.php?r=AppShop/GetAllShopCouponList',
      data: {
        parent_app_id: app.globalData.appId,
        latitude: that.data.latitude,
        longitude: that.data.longitude,
        industry_type: that.data.currentCate,
        page: that.allCouponData.page,
        page_size: 10
      },
      success: function (res) {
        let oldList = that.data.couponList;
        let data = res.data;
        if (that.allCouponData.page == 1){
          oldList = [];
        }
        for (let index in data) {
          let distance = data[index].distance;
          data[index].distance = util.formatDistance(distance);
        }
        that.setData({
          couponList: oldList.concat(data),
          couponNoMore: res.is_more == 0
        });
        that.allCouponData.page++;
        that.allCouponData.nomore = res.is_more == 0;
      },
      complete: function(){
        that.allCouponData.loading = false
      }
    })
  },
  // 跳转到子店
  gotoShop: function(e){
    let appid = e.currentTarget.dataset.appid;
    let mode = e.currentTarget.dataset.mode;

    if (this.data.headquartersId == appid){
      let home = app.getHomepageRouter();
      app.reLaunch({
        url: '/pages/' + home + '/' + home
      })
    }else{
      let param = {};
      param.detail = appid;
      app.goToFranchisee(mode, param);
    }
  },
  // 关闭多商家领取优惠券成功弹窗
  closeRecvCouponPopFranchisee: function(){
    this.setData({
      recvCouponPopFranchisee: false
    })
  },
  // tab切换
  clickLoading: false,
  changeTab: function(e){
    let id = e.currentTarget.dataset.id;
    
    if (id == this.data.currentCate){
      return;
    }
    if (this.clickLoading){
      app.showModal({content: '请勿频繁点击分类'});
      return;
    }
    this.clickLoading = true;
    setTimeout(()=>{
      this.clickLoading = false;
    }, 500);

    this.setData({
      currentCate : id,
      couponNoMore: false
    });
    this.allCouponData.page = 1;
    this.allCouponData.nomore = false;
    this.allCouponData.loading = false;

    this.getAllShopCouponList();
  },
  // 多商家优惠券滚动加载
  onReachBottom: function(e){
    let that = this;
    if (that.data.isParentShop){
      that.getAllShopCouponList();
    }
  }
})
