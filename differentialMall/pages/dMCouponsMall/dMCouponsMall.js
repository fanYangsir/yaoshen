const util = require('../../../utils/util.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isHideMoreNav: true,
    firstCategory: {
      cateIndex: 1,
      cateTxt: '最受欢迎'
    },
    secondCategory: {
      cateIndex: 4,
      cateTxt: '智能排序'
    },
    locationCity: {
      city: '定位中...',
      id: '',
      location: {
        lat: '',
        lng: ''
      }
    },
    searchContent: {
      isInput: false,
      inputContent: ''
    },
    merchantsList: [],
    merchantsLoadingData: {
      currentPage: 1,
      isMore: 1,
      isLoading: false
    },
    merchantsListNullTip: {
      tipImg: '',
      tipTxt: ''
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
    // 判断是否iPhone x 兼容底部tabbar
    let systemInfo = app.getSystemInfoData(),
    isIpx = false;
    if (systemInfo.model.search('iPhone X') != -1) {
      isIpx = true;
    } else {
      isIpx = false;
    }
    this.setData({
      isIpx: isIpx
    });
    // 用来判断是否需要刷新页面数据 首次需要
    app.globalData.dMParamIsChange = true;
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 获取当前位置
    this.getCurrentLocation();
    // app.sendRequest({
    //   url: '/index.php?r=CrossPlatform/ceshi'
    // });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({
      'searchContent.isInput': false,
      'searchContent.inputContent': '',
      'isHideMoreNav': true
    });
  },
  /**
   * 获取当前位置
   */
  getCurrentLocation: function() {
    let that = this,
      dataObj = this.data,
      globalDataObj = app.globalData;

    let location = globalDataObj.locationInfo,
      lat = location.latitude,
      lng = location.longitude,
      info = location.info;

    // 如果全局变量没有经纬度，重新获取
    if (lat === '' || lng === '' || info === '') {
      app.getLocation({
        success: function(res) {
          if (res.errMsg === 'getLocation:ok') {
            let latitude = res.latitude,
              longitude = res.longitude;
            // 经纬度保存到全局变量
            globalDataObj.locationInfo.latitude = latitude;
            globalDataObj.locationInfo.longitude = longitude;
            globalDataObj.dMChooseCity = {
              'city': '',
              'id': '',
              'location': {
                'lat': latitude,
                'lng': longitude
              }
            };
            // 根据经纬度获取地理位置
            app.getAddressByLatLng({
              lat: latitude,
              lng: longitude
            }, function(res) {
              let returnData = res.data;
              // 地址信息保存到全局变量
              globalDataObj.locationInfo.info = returnData;
              let city = returnData.ad_info.city,
                len = city && city.length;
              globalDataObj.dMChooseCity.city = city;
              if (len) {
                //把“市”字去掉
                city = city.charAt(len - 1) === '市' ? city.substring(0, len - 1) : city;
              }
              that.setData({
                'locationCity.city': city,
                'locationCity.location.lat': latitude,
                'locationCity.location.lng': longitude
              });
              // 先初始化数据
              that.initialMerchantsData();
              // 获取商家列表
              that.getMerchantsList();
            })
          } 
        },
        fail: function (res) {
          app.showModal({
            title: '请重新授权地理位置',
            content: '注：授权定位后才可获取你附近的商家',
            showCancel: true,
            cancelColor: '#666',
            confirmColor: '#ff7100',
            confirm: function (res) {
              if (res.confirm) {
                // 打开设置页
                wx.openSetting({
                  success(res) {
                    console.log(res.authSetting)
                  }
                })
              }
            },
            cancel: function () {
              // 取消则定位失败
              let city = dataObj.locationCity.city;
              let cityTip = '';
              if (city === '定位中...') {
                cityTip = '定位失败';
              } else {
                cityTip = city;
              }
              that.setData({
                'locationCity.city': cityTip,
              })
            }
          })
          // 获取当前的城市名
          let city = globalDataObj.dMChooseCity && globalDataObj.dMChooseCity.city || '定位中...',
            id = globalDataObj.dMChooseCity && globalDataObj.dMChooseCity.id || '';
          // 城市名长度
          let len = city && city.length;
          if (len) {
            city = city.charAt(len - 1) === '市' ? city.substring(0, len - 1) : city;
          }
          that.setData({
            'locationCity.city': city,
            'locationCity.id': id,
          })
          // 先初始化数据
          that.initialMerchantsData();
          // 获取商家列表
          that.getMerchantsList();
        }
      });
    } else {
      // 获取全局位置信息
      let globalLocation = globalDataObj.dMChooseCity || info.ad_info;
      let city = globalLocation && globalLocation.city,
        globalId = globalLocation && globalLocation.id || '',
        globalLat = globalLocation && globalLocation.location.lat,
        globalLng = globalLocation && globalLocation.location.lng;
      // 城市名长度
      let len = city && city.length;
      if (len) {
        city = city.charAt(len - 1) === '市' ? city.substring(0, len - 1) : city;
      }
      this.setData({
        'locationCity.city': city,
        'locationCity.id': globalId,
        'locationCity.location.lat': globalLat,
        'locationCity.location.lng': globalLng
      });
      // 参数改变才重新刷新数据
      if (globalDataObj.dMParamIsChange) {
        // 先初始化数据
        this.initialMerchantsData();
        // 获取商家列表
        this.getMerchantsList();
      }
    }
  },
  /**
   * 获取商家列表
   */
  getMerchantsList: function() {
    let that = this,
      dataObj = this.data;

    let firstCateType = dataObj.firstCategory.cateIndex, // 一级分类
      secondCateType = dataObj.secondCategory.cateIndex || 4; // 二级分类

    let cityName = dataObj.locationCity.city, // 城市名
      cityId = dataObj.locationCity.id, // 城市id
      cityLat = dataObj.locationCity.location.lat, // 纬度
      cityLng = dataObj.locationCity.location.lng;  // 经度
    
    let searchContent = dataObj.searchContent.inputContent; // 搜索内容

    let loadingData = dataObj.merchantsLoadingData,
      currentPage = loadingData.currentPage, // 当前页
      isMore = loadingData.isMore, // 是否还有数据
      isLoading = loadingData.isLoading, // 是否正在加载
      pageSize = loadingData.pageSize || 10; // 加载条数

    if (isMore === 0 || isLoading) {
      return false;
    }

    this.setData({
      'merchantsLoadingData.isLoading': true
    });
    // 接口需要的参数
    let param = {
      page: currentPage,
      page_size: pageSize,
      from_data: {
        'first_type': firstCateType,
        'two_type': secondCateType,
        'address_id': cityId,
        'address_name': cityName,
        'address_point': {
          'latitude': cityLat,
          'longitude': cityLng
        },
        'search': searchContent
      }
    };

    let merchantsList = dataObj.merchantsList;

    app.sendRequest({
      url: '/index.php?r=CrossPlatform/CouponMall',
      data: param,
      method: 'post',
      success: function(res) {
        let returnList = res.data;

        // 没有数据的提示
        if ((returnList && returnList.length === 0) || returnList === '' || returnList === null) { // 数据为空
          that.setData({
            'merchantsListNullTip.tipImg': 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/xcx-differentialMall/icon_data_null.png',
            'merchantsListNullTip.tipTxt': '暂无数据喔~',
          });
          return;
        }

        let tempArr = [];

        for (let i = 0, len = returnList.length; i < len; i++) {
          let item = returnList[i];
          let newData = {};
          newData = item;
          // 商家类别
          newData.industry_name = item.industry_name || '';
          let distance = item.distance;
            distance = +distance !== 0 ? (distance ? util.formatDistance(distance) : '') : '0m';
          // 商家和用户距离
          newData.distance = distance;
          tempArr.push(newData);
        }

        that.setData({
          'merchantsList': merchantsList.concat(tempArr),
          'merchantsLoadingData.currentPage': (res.current_page || 0) + 1,
          'merchantsLoadingData.isMore': res.is_more,
          'merchantsLoadingData.isLoading': false
        });
        app.globalData.dMParamIsChange = false;
      },
      complete: function () {
        // 停止刷新
        wx.stopPullDownRefresh();
      }
    });
  },
  /**
   * 收藏或者取消收藏
   */
  toggleFavoriteMerchant: function (e) {
    let that = this,
      dataObj = this.data,
      datasetObj = e.currentTarget.dataset;

    // 是否收藏
    let isFavorite = +datasetObj.isFavorite === 0 ? 1 : 0,
      listIndex = +datasetObj.index;
    if (+dataObj.merchantsList[listIndex].is_collection === isFavorite) {
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
          [`merchantsList[${listIndex}].is_collection`]: isFavorite
        });
      }
    });
  },
  /**
   * 搜索框输入事件
   */
  searchInputHandler: function (e) {
    let inputVal = e.detail.value;
    // 判断是否有内容
    let hasContent = (inputVal == null || inputVal.trim()) === '' ? false : true;
    this.setData({
      'searchContent.isInput': hasContent,
      'searchContent.inputContent': inputVal,
      'isHideMoreNav':true
    });
    if (hasContent) {
      this.initialMerchantsData();
    } else {
      this.getMerchantsList();
    }
  },
  /**
   * 搜索框失去焦点事件
   */
  searchBlurHandler: function (e) {
    this.getMerchantsList();
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
    if (url) {
      app.turnToPage(url, isRedirect);
    }
  },
  /**
   * 显示更多导航
   */
  toggleMoreNavHander: function() {
    let dataObj = this.data;
    let isHide = dataObj.isHideMoreNav;
    if (isHide) {
      this.setData({
        'secondCategory.cateIndex': '',
        'secondCategory.cateTxt': ''
      });
    }
    isHide = isHide === true ? false : true;
    this.setData({
      isHideMoreNav: isHide
    });
  },
  /**
   * 选择商家的类型（最受欢迎，离我最近，我常光顾）
   */
  selectFirstCategory: function(e) {
    let tempArr = ['最受欢迎', '离我最近', '我常光顾'];
    let datasetObj = e.currentTarget.dataset;
    // 下标
    let selectedIndex = +datasetObj.index;
    this.setData({
      'firstCategory.cateIndex': selectedIndex,
      'firstCategory.cateTxt': tempArr[selectedIndex - 1],
      'secondCategory.cateIndex': 4,
      'secondCategory.cateTxt': '智能排序',
    });
    // 先初始化数据
    this.initialMerchantsData();
    // 隐藏tab
    this.toggleMoreNavHander();
    // 获取商家列表
    this.getMerchantsList();
  },
  /**
   * 选择二级分类
   */
  selectSecondCategory: function(e) {
    let tempArr = ['智能排序', '距离优先'];
    let dataObj = this.data, 
      datasetObj = e.currentTarget.dataset;
    // 下标
    let selectedIndex = +datasetObj.index;
    // 离我最近时，距离优先不可选择
    if (+dataObj.firstCategory.cateIndex === 2 && selectedIndex === 5) {
      return false;
    }
    this.setData({
      'secondCategory.cateIndex': selectedIndex,
      'secondCategory.cateTxt': tempArr[selectedIndex - 4],
    });
    // 先初始化数据
    this.initialMerchantsData();
    // 获取商家列表
    this.getMerchantsList();
  },
  /**
   * 初始化商家列表数据
   */
  initialMerchantsData: function (e) {
    this.setData({
      'merchantsList': [],
      'merchantsLoadingData.currentPage': 1,
      'merchantsLoadingData.isMore': 1,
      'merchantsLoadingData.isLoading': false,
      'merchantsListNullTip.tipImg': '',
      'merchantsListNullTip.tipTxt': ''
    });
  },
  /**
   * 立即兑换点击事件
   */
  exchangeBtnHandler: function(e) {
    let that = this,
      datasetObj = e.currentTarget.dataset;

    let couponId = datasetObj.id, // 优惠券id
      merchantId = datasetObj.mid; // 商家id

    app.showModal({
      title: '是否确认兑换？',
      content: '注：兑换成功后不支持退换',
      showCancel: true,
      cancelColor: '#666',
      confirmColor: '#ff7100',
      confirm: function(res) {
        // 点击确定
        if (res.confirm) {
          app.sendRequest({
            url: '/index.php?r=CrossPlatform/ExchangeCoupon',
            data: {
              coupon_id: couponId,
              merchant_id: merchantId
            },
            success: function(res) {
              if (res.status == 0 && res.data != 1 && res.msg === undefined) {
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
  },
  /**
   * 滚动到底部
   */
  onReachBottom: function (e) {
    this.getMerchantsList();
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.initialMerchantsData();
    this.getMerchantsList();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '【微分商城】海量商家优惠券等你去领！',
      path: '/differentialMall/pages/dMWebView/dMWebView'
    }
  }
})