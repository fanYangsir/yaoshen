const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isHidePhoneCall: true,
    merchantInfo: {
      name: '',
      isFavorite: 0,
      location: {
        latitude: '',
        longitude: '',
        address: ''
      },
      imgs: [],
      type: '',
      phone: '',
      couponsList: []
    },
    toastInfo: {
      isShow: false,
      tipTxt: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取商家id
    let mId = options && options.id;
    this.setData({
      merchantId: mId,
    });
    // 获取商家详情信息
    this.getMerchantDetail();
  },
  /**
   * 获取商家详情信息
   */
  getMerchantDetail: function () {
    let that = this,
      dataObj = this.data;
    // 商家id
    let mId = dataObj.merchantId;

    app.sendRequest({
      url: '/index.php?r=CrossPlatform/GetMerchant',
      data: {
        merchant_id: mId
      },
      success: function (res) {
        let returnData = res.data;
        // 将商家图片保存为数组形式
        let merchantImgs = [];
        if (typeof returnData.logo === 'string') {
          merchantImgs.push(returnData.logo);
        } else {
          merchantImgs = returnData.logo;
        }
        // 优惠券列表
        let couponsList = returnData.coupon_list || [];
        // 拼商家地址
        let address = returnData.region_address && (returnData.region_data.region_address + ' ' + returnData.address_detail) || '';
        let location = {
          latitude: returnData.latitude,
          longitude: returnData.longitude,
          address: address
        };

        let newData = {};
        newData['merchantInfo'] = returnData;
        newData['merchantInfo.isFavorite'] = returnData.is_collection || 0;
        newData['merchantInfo.imgs'] = merchantImgs;
        newData['merchantInfo.location'] = location;
        newData['merchantInfo.couponsList'] = couponsList || [];
        that.setData(newData);
      }
    });
  },
  /**
   * 立即兑换点击事件
   */
  exchangeBtnHandler: function (e) {
    let that = this,
      datasetObj = e.currentTarget.dataset;

    let couponId = datasetObj.id,   // 优惠券id
      merchantId = datasetObj.mid; // 商家id

    app.showModal({
      title: '是否确认兑换？',
      content: '注：兑换成功后不支持退换',
      showCancel: true,
      cancelColor: '#666',
      confirmColor: '#ff7100',
      confirm: function (res) {
        // 点击确定
        if (res.confirm) {
          app.sendRequest({
            url: '/index.php?r=CrossPlatform/ExchangeCoupon',
            data: {
              coupon_id: couponId,
              merchant_id: merchantId
            },
            success: function (res) {
              if (res.status == 0 && res.data != 1 && res.msg == undefined) {
                // 跳转到兑换成功引导页
                app.turnToPage(`/differentialMall/pages/dMCouponSuccess/dMCouponSuccess?mId=${merchantId}&cId=${couponId}&uId=${res.data}`);
              } else {
                // 兑换不成功 toast提示
                that.showToast(res.msg);
              }
            }
          });
        }
      }
    });
  },
  /**
   * 收藏或者取消收藏
   */
  toggleFavoriteMerchant: function(e) {
    let that = this,
      dataObj = this.data,
      datasetObj = e.currentTarget.dataset;
    
    // 是否收藏
    let isFavorite = +datasetObj.isFavorite === 0 ? 1 : 0;
    if (+dataObj.merchantInfo.isFavorite === isFavorite) {
      return;
    }
    // 商家id
    let merchantId = datasetObj.id;
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/CollectionAppId',
      hideLoading: true,
      data: {
        status: isFavorite,
        merchant_id: merchantId
      },
      success: function () {
        // 收藏商家
        if (isFavorite) {
          that.showToast('收藏成功');
        } else { // 取消收藏商家
          that.showToast('已取消收藏');
        }
        that.setData({
          'merchantInfo.isFavorite': isFavorite
        });
      }
    });
  },
  /**
   * 预览商家图片
   */
  previewMerchantImgs: function (e) {
    let datasetObj = e.currentTarget.dataset;
    // 商家所有图片
    let imgsArr = datasetObj.imgs,
      // 选中的图片
      imgSrc = datasetObj.imgSrc;
    app.previewImage({
      current: imgSrc,
      urls: imgsArr
    });
  },
  /**
   * 是否显示打电话
   */
  togglePhoneCall: function(e) {
    let dataObj = this.data;
    // 判断是否iPhone iPhone不需要弹窗
    let isIphone = /ios/i.test(app.globalData.systemInfo.platform);
    if (isIphone) {
      let phoneNum = e.currentTarget.dataset.phone;
      app.makePhoneCall(phoneNum);
      return;
    }
    let isHide = dataObj.isHidePhoneCall;
    isHide = isHide === true ? false : true;
    this.setData({
      isHidePhoneCall: isHide
    });
  },
  /**
   * 打电话
   */
  makePhoneCall: function(e) {
    let datasetObj = e.currentTarget.dataset;
    let phone = datasetObj.phone || '';
    app.makePhoneCall(phone);
    // 隐藏拨打电话
    this.setData({
      isHidePhoneCall: true
    });
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '【微分商城】海量商家优惠券等你去领！',
      path: '/differentialMall/pages/dMWebView/dMWebView'
    }
  },
  /**
   * 打开微信地图
   */
  openWXMap: function() {
    let dataObj = this.data;
    // 显示的位置
    let location = dataObj.merchantInfo.location;
    app.openLocation({
      latitude: +location.latitude,
      longitude: +location.longitude,
      address: location.address
    });
  },
  /**
   * 页面跳转
   */
  turnToPage: function(e) {
    let datasetObj = e.currentTarget.dataset;
    // 跳转url
    let url = datasetObj.url;
    // 是否redirect
    let isRedirect = datasetObj.isRedirect === 'false' ? false : true;
    if (!url) {
      return;
    }
    app.turnToPage(url, isRedirect);
  },
  /**
   * 显示toast
   */
  showToast: function (title, duration = 1500) {
    this.setData({
      'toastInfo.isShow': true,
      'toastInfo.tipTxt': title
    });
    setTimeout(() => {
      this.setData({
        'toastInfo.isShow': false,
        'toastInfo.tipTxt': '',
      });
    }, duration);
  }
})