const util = require('../../../utils/util.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isHideCouponNav: true,
    isHideRecordNav: true,
    navIndex: 1,
    diffIndex: 1,
    couponsCurrentType: {
      type: 1,
      text: '已兑换'
    },
    couponsLoadingData: {
      currentPage: 1,
      isMore: 1,
      isLoading: false
    },
    couponsListNullTip: {
      tipImg: '',
      tipTxtArr: ['暂无兑换优惠券，赶紧去兑换吧！', '暂无激活优惠券，赶紧去激活吧！', '暂无使用优惠券，赶紧去使用吧！', '暂无失效优惠券，赶紧去使用吧！'],
      tipTxt: ''
    },
    couponTypeArr: [{
      type: 1,
      text: '已兑换'
    }, {
      type: 2,
      text: '已激活'
    }, {
      type: 3,
      text: '已使用'
    }, {
      type: 4,
      text: '已失效'
    }],
    couponsList: [],
    recordsCurrentType: {
      type: 0,
      text: '全部'
    },
    recordsList: [],
    recordsLoadingData: {
      currentPage: 1,
      isMore: 1,
      isLoading: false,
      listIndex: 0
    },
    diffCurrentMonthData: {
      incomeExpensesDiff: [0, 0],
      merchantReceiveDiff: [],
      receiveDiffTotal: '0.00'
    },
    barMaxHeight: 426,
    userCenterInfo: {
      differentialNum: '0.00',
      merchantsNum: 0,
      couponsNum: 0
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
  onLoad: function (options) {
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
    this.setData({
      canvasWidth: this.remSize(340),
      canvasHeight: this.remSize(184)
    });
  },


  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 获取用户信息
    this.getUserCenterInfo();
    // 获取本月积分使用情况
    this.getDiffCurrentMonthData();
    // 获取微分记录
    this.getDiffRecordList();
    if (+this.data.navIndex === 3) {
      this.initialListData('merchants');
      this.getMerchantsList();
    }
    this.setData({
      isHideCouponNav: true,
      isHideRecordNav: true
    });
    app.globalData.dMParamIsChange = true;
  },

  /**
   * 生命周期函数--监听页面卸载
   */

  onUnload: function () {
    // 清除定时器
    clearInterval(this.interval);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let dataObj = this.data;
    let navIndex = +dataObj.navIndex;
    if (navIndex === 1) {
      // 获取微分记录
      this.getDiffRecordList();
    } else if (navIndex === 2) {
      // 加载更多优惠券
      this.getCouponsList();
    } else {
      // 加载更多已收藏的商家
      this.getMerchantsList();
    }
  },

  /**
   * 获取用户信息
   */
  getUserCenterInfo: function () {
    let that = this;
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/PersonalCenter',
      hideLoading: true,
      success: function (res) {
        let returnData = res.data;
        let tempObj = {};
        // 用户昵称
        tempObj.nickName = returnData.nickname || userInfo.nickname;
        // 用户头像
        tempObj.coverThumb = returnData.headimgurl || userInfo.cover_thumb || app.globalData.appLogo;
        // 微分数量
        tempObj.differentialNum = returnData.cross_integral || '0.00';
        // 收藏商家数量
        tempObj.merchantsNum = returnData.collection_app_num || 0;
        // 优惠券数量
        tempObj.couponsNum = returnData.coupon_num || 0;
        that.setData({
          userCenterInfo: tempObj
        });
        // 如果没有头像和昵称则将小程序获取到的头像和昵称发给接口
        if (!returnData.nickname || !returnData.headimgurl) {
          let param = {
            from_data: {
              'nickname': tempObj.nickName,
              'headimgurl': tempObj.coverThumb
            }
          };
          app.sendRequest({
            url: '/index.php?r=CrossPlatform/SetPersonalInfo',
            data: param,
            method: 'post'
          });
        }
      }
    });
  },

  /**
   * 获取微分本月总数据
   */
  getDiffCurrentMonthData: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/IntegralOverview',
      hideLoading: true,
      data: {
        page: 1,
        page_size: 12,
        status: 2
      },
      success: function (res) {
        let returnData = res.data, // 收支和获取数据
          ringDataArr = [], // 圆环图数据
          receiveTotal = 0; // 总微分
        // 微分兑换
        ringDataArr[0] = +returnData[1].sum_ !== 0 ? returnData[1].sum_.substring(1) : '0.00';
        // 消费获取
        ringDataArr[1] = +returnData[0].sum_ !== 0 ? returnData[0].sum_ : '0.00';
        // 获取的总微分
        receiveTotal = ringDataArr[1];

        let returnList = res.list || [], // 商家列表
          lLen = returnList && returnList.length, // 商家个数
          forLen = lLen > 12 ? 12 : lLen, // 遍历数组的长度，只遍历前12个商家
          barDataArr = []; // 柱状图数据

        if (lLen > 0) {
          let maxValue = returnList[0].sum_, //微分最大值
            twelveTotal = res.sum_count, // 前12个商家的微分总和
            otherTotal = 0; // 十二个之外的其他值
          // 计算有没有其他 
          if (receiveTotal > twelveTotal) {
            otherTotal = receiveTotal - twelveTotal; // 其他条形图的值
            maxValue = maxValue > otherTotal ? maxValue : otherTotal; // 判断是一个元素大还是其他值大
          }

          for (let i = 0; i < forLen; i++) {
            let item = returnList[i];
            // 最长400rpx
            let eachPart = 380 / maxValue;
            let tempObj = {
              'name': '',
              'width': 0,
              'value': 0
            };
            // 商家名
            tempObj.name = item.app_name || '';
            // 微分值
            tempObj.value = item.sum_ || '0.00';
            // 条形图长度 20是最小长度
            tempObj.width = item.sum_ * eachPart + 20;
            barDataArr.push(tempObj);
          }
          // 大于12个商家的归类为其他
          if (otherTotal) {
            let otherObj = {
              'name': '其他',
              'value': otherTotal,
              'width': otherTotal * 380 / maxValue + 20
            };
            barDataArr.push(otherObj);
          }
        } else {
          barDataArr = [];
        }

        // 绑定数据
        that.setData({
          'diffCurrentMonthData.incomeExpensesDiff': ringDataArr,
          'diffCurrentMonthData.merchantReceiveDiff': barDataArr,
          'diffCurrentMonthData.receiveDiffTotal': that.numToThousands(receiveTotal)
        });
        // 画圆环图
        that.drawDifferentialRing();
      }
    });
  },

  /**
   * 获取微分记录
   */
  getDiffRecordList: function () {
    let that = this,
      dataObj = this.data;

    // 微分记录类型
    let recordType = dataObj.recordsCurrentType.type === 0 ? '' : dataObj.recordsCurrentType.type,
      recordsList = dataObj.recordsList || []; // 微分记录列表

    let loadData = dataObj.recordsLoadingData,
      isMore = loadData.isMore,
      isLoading = loadData.isLoading,
      currentPage = loadData.currentPage,
      pageSize = loadData.pageSize || 12,
      recordsIndex = loadData.listIndex;
    // 如果加载中或者请求超过了一年后的数据则返回
    if (isLoading || recordsIndex > 11) {
      return false;
    }
    // 最近一年的月份和时间戳
    let timestampArr = this.getEachMonthTimestamp(12);
    // console.log(timestampArr);
    // 正在请求
    that.setData({
      'recordsLoadingData.isLoading': true
    });
    // 接口请求参数
    let param = {
      status: recordType,
      time: timestampArr[recordsIndex].timestamp,
      page: currentPage,
      page_size: pageSize
    };
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/IntegralLog',
      data: param,
      success: function (res) {
        let returnData = res.data, // 微分月份数据
          returnList = res.list || []; // 微分记录列表

        // 格式化日期
        for (let i = 0, len = returnList.length; i < len; i++) {
          returnList[i].add_time = that.formatDate(returnList[i].add_time * 1000, 'yyyy-MM-dd');
        }

        let newData = {};
        // 月份
        newData['month'] = recordsIndex === 0 ? '本月' : timestampArr[recordsIndex].month + '月';

        if (recordType === '') {
          if (returnData.length === 2) { // 同时返回获取和使用数据
            // 获取的微分
            newData['getDiff'] = returnData[0] && returnData[0].sum_ || '0.00';
            // 使用的微分
            newData['useDiff'] = returnData[1] && returnData[1].sum_ || '0.00';
          } else if (returnData.length === 1) { // 只返回获取数据或者使用数据
            if (+returnData[0].status === 1) {
              newData['getDiff'] = returnData[0] && returnData[0].sum_ || '0.00';
              newData['useDiff'] = '0.00';
            } else {
              newData['getDiff'] = '0.00';
              newData['useDiff'] = returnData[0] && returnData[0].sum_ || '0.00';
            }
          } else { // 数据为空
            newData['getDiff'] = '0.00';
            newData['useDiff'] = '0.00';
          }
        } else if (recordType === 1) {
          // 获取的微分
          newData['getDiff'] = returnData[0] && returnData[0].sum_ || '0.00';
        } else {
          // 使用的微分
          newData['useDiff'] = returnData[1] && returnData[1].sum_ || '0.00';
        }

        // 拼接微分记录列表
        newData['recdList'] = recordsList[recordsIndex] === undefined ? returnList : recordsList[recordsIndex].recdList.concat(returnList) || [];

        recordsList[recordsIndex] = newData;

        let isMore = res.is_more || 0;

        // 本月没有更多，请求下一个月
        if (+isMore === 0) {
          recordsIndex = recordsIndex + 1;
          currentPage = 1;
          isMore = 1;
        } else {
          currentPage = (res.current_page || 0) + 1;
          isMore = res.is_more;
        }
        setTimeout(()=>{
          that.setData({
            recordsList: recordsList,
            'recordsLoadingData.currentPage': currentPage,
            'recordsLoadingData.isMore': isMore,
            'recordsLoadingData.isLoading': false,
            'recordsLoadingData.listIndex': recordsIndex
          });
        },360);
      },
      fail: function () {

      }
    });
  },

  /**
   * 获取优惠券列表
   */
  getCouponsList: function () {
    let that = this,
      dataObj = this.data;

    // 优惠券类型
    let type = dataObj.couponsCurrentType.type,
      currentCouponsList = dataObj.couponsList, // 当前的优惠券列表
      tipTxtArr = dataObj.couponsListNullTip.tipTxtArr; // 没有数据时提示文案

    // 加载状态数据
    let loadData = dataObj.couponsLoadingData,
      isMore = loadData.isMore,
      isLoading = loadData.isLoading,
      currentPage = loadData.currentPage,
      pageSize = loadData.pageSize || 10;

    // 如果没有数据或者加载中则返回
    if (+isMore === 0 || isLoading) {
      return false;
    }
    that.setData({
      'couponsLoadingData.isLoading': true
    });
    // 给接口的参数
    let param = {
      'status': type,
      'page': currentPage,
      'page_size': pageSize
    };
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/Coupon',
      data: param,
      success: function (res) {
        let returnList = res.data || [];
        if (returnList && returnList.length === 0) { // 数据为空
          that.setData({
            'couponsListNullTip.tipImg': 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/xcx-differentialMall/icon_coupons_null.png',
            'couponsListNullTip.tipTxt': tipTxtArr[type - 1],
          });
          return;
        }
        that.setData({
          'couponsList': currentCouponsList.concat(returnList),
          'couponsLoadingData.currentPage': (res.current_page || 0) + 1,
          'couponsLoadingData.isMore': +res.is_more,
          'couponsLoadingData.isLoading': false,
        });
      },
    });
  },

  /**
   * 获取收藏的商家列表
   */
  getMerchantsList: function () {
    let that = this,
      dataObj = this.data;

    // 当前收藏的商家列表
    let currentMerchantsList = dataObj.merchantsList;

    // 加载状态数据
    let loadData = dataObj.merchantsLoadingData,
      isMore = loadData.isMore,
      isLoading = loadData.isLoading,
      currentPage = loadData.currentPage,
      pageSize = loadData.pageSize || 10;

    // 如果没有数据或者加载中则返回
    if (+isMore === 0 || isLoading) {
      return false;
    }

    that.setData({
      'merchantsLoadingData.isLoading': true
    });

    let param = {
      'page': currentPage,
      'page_size': pageSize
    };

    app.sendRequest({
      url: '/index.php?r=CrossPlatform/CollectionList',
      data: param,
      success: function (res) {
        let returnList = res.data || [];
        // 数据为空时的提示信息
        if (returnList && returnList.length === 0) {
          that.setData({
            'merchantsListNullTip.tipImg': 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/xcx-differentialMall/icon_merchants_null.png',
            'merchantsListNullTip.tipTxt': '暂无收藏，赶紧去添加吧！'
          });
          return;
        }
        that.setData({
          // 将之前加载的数据合并
          'merchantsList': currentMerchantsList.concat(returnList),
          'merchantsLoadingData.currentPage': (res.current_page || 0) + 1,
          'merchantsLoadingData.isMore': +res.is_more,
          'merchantsLoadingData.isLoading': false,
        });
      }
    });
  },

  /**
   * 取消收藏商品
   */
  cancleFavoriteMerchant: function (e) {
    let that = this,
      dataObj = this.data;
    // 商家id
    let merchantsId = e.currentTarget.dataset.id,
      merchantsList = dataObj.merchantsList;
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/CollectionAppId',
      hideLoading: true,
      data: {
        status: 0,
        merchant_id: merchantsId
      },
      success: function () {
        let tempArr = [];
        // 将用户取消收藏的商家移出数组
        for (let i = merchantsList.length; i--;) {
          if (merchantsList[i].app_id !== merchantsId) {
            tempArr.push(merchantsList[i])
          }
        }
        if (tempArr && tempArr.length === 0) {
          // 如果所有收藏取消了，初始化数据重新请求
          that.initialListData('merchants');
          that.getMerchantsList();
        }
        that.setData({
          merchantsList: tempArr
        });
        // toast提示
        that.showToast('已取消收藏');
        // 更新收藏数量
        that.getUserCenterInfo();
      }
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
    if (!url) {
      return;
    }
    app.turnToPage(url, isRedirect);
  },

  /**
   * 导航切换
   */
  navSwitchHander: function (e) {
    let dataObj = this.data, 
      datasetObj = e.currentTarget.dataset;
    let index = +datasetObj.index;
    // 点击的是同一个导航直接返回
    if (this.data.navIndex === index) {
      return false;
    }

    if (index === 1) {
      // 本月数据（圆环图和柱状图）
      this.getDiffCurrentMonthData();
      this.setData({
        diffIndex: index
      });
      if (dataObj.recordsList && dataObj.recordsList.length === 0) {
        // 先初始化数据
        this.initialListData('records');
        // 微分记录
        this.getDiffRecordList();
      }
    } else if (index === 2) {
      if (dataObj.couponsList && dataObj.couponsList.length === 0) {
        this.initialListData('coupons');
        // 获取优惠券列表
        this.getCouponsList();
      }
    } else {
      if (dataObj.merchantsList && dataObj.merchantsList.length === 0) {
        this.initialListData('merchants');
        // 获取收藏的商家
        this.getMerchantsList();
      }
    }
    this.setData({
      navIndex: index
    });
  },

  /**
   * 收支获取直接切换
   */
  diffSwitchHander: function (e) {
    let dataObj = this.data,
      datasetObj = e.currentTarget.dataset;

    let selectedindex = +datasetObj.index, // 选中的index
      currentIndex = +dataObj.diffIndex; // 当前的index

    // 如果两次点击的是不一样才处理
    if (selectedindex !== currentIndex) {
      if (selectedindex === 1) {
        // 重新画圆环图
        this.drawDifferentialRing();
      } else {
        // 清除定时器
        clearInterval(this.interval);
      }
      this.setData({
        diffIndex: selectedindex
      });
    }
  },

  /**
   * 不同类型微分记录切换
   */
  selectRecordType: function (e) {
    let tempArr = ['全部', '获取', '使用'];
    let datasetObj = e.currentTarget.dataset;

    let selectedIndex = +datasetObj.index;

    // 初始化数据
    this.initialListData('records');
    this.setData({
      'recordsCurrentType.type': selectedIndex,
      'recordsCurrentType.text': tempArr[selectedIndex],
    });
    // 隐藏记录类型
    this.toggleMoreType('isHideRecordNav');
    // 获取微分记录
    this.getDiffRecordList();
  },

  /**
   * 不同类型优惠券切换
   */
  selectCouponType: function (e) {
    let dataObj = this.data,
      datasetObj = e.currentTarget.dataset;

    let selectedIndex = +datasetObj.index;
    let couponTypeArr = dataObj.couponTypeArr;

    // 先初始化数据
    this.initialListData('coupons');
    this.setData({
      'couponsCurrentType.type': couponTypeArr[selectedIndex].type,
      'couponsCurrentType.text': couponTypeArr[selectedIndex].text
    });
    // 隐藏优惠券类型
    this.toggleMoreType('isHideCouponNav');
    // 获取优惠券数据
    this.getCouponsList();
  },

  /**
   * 显示更多商家微分
   */
  toggleMoreBar: function () {
    let dataObj = this.data;

    let barMaxH = dataObj.barMaxHeight, // 最多条形图显示条数
      dataLen = dataObj.diffCurrentMonthData.merchantReceiveDiff.length; // 当前商家的个数

    barMaxH = barMaxH === 426 ? dataLen * 76 - 30 : 426;

    this.setData({
      barMaxHeight: barMaxH
    });
  },

  /**
   * 显示隐藏
   */
  toggleMoreType: function (e) {
    let dataObj = this.data;
    let dataName = '';
    if (typeof e === 'string') { // js调用
      dataName = e;
    }
    if (typeof e === 'object' && e.currentTarget) { // wxml调用
      let datasetObj = e.currentTarget.dataset;
      dataName = datasetObj.name;
    }

    let isHide = dataObj[dataName];

    isHide = isHide === true ? false : true;

    this.setData({
      [dataName]: isHide
    });
  },

  /**
   * 初始化列表相关数据
   */
  initialListData: function (str) {
    let newData = {};

    newData[str + 'List'] = [];
    newData[str + 'LoadingData.currentPage'] = 1;
    newData[str + 'LoadingData.isMore'] = 1;
    newData[str + 'LoadingData.isLoading'] = false;

    if (str === 'records') { // 微分记录
      newData[str + 'LoadingData.listIndex'] = 0;
      newData[str + 'CurrentType.type'] = 0;
      newData[str + 'CurrentType.text'] = '全部';
      newData['isHideCouponNav'] = true;
    }
    if (str === 'coupons') { // 优惠券
      newData[str + 'CurrentType.type'] = 1;
      newData[str + 'CurrentType.text'] = '已兑换';
      newData['isHideRecordNav'] = true;
    }
    if (str === 'coupons' || str === 'merchants') { // 优惠券或者收藏商家
      newData[str + 'ListNullTip.tipImg'] = '';
      newData[str + 'ListNullTip.tipTxt'] = '';
    }
    this.setData(newData);
  },


  /**
   * 画圆环图
   */
  drawDifferentialRing: function () {
    let that = this;
    // 圆环数据数组
    let originDataArr = this.data.diffCurrentMonthData.incomeExpensesDiff;
    let dataArr = [];
    // 如果没有数据显示的时候各占50%
    if (+originDataArr[0] === 0 && +originDataArr[1] === 0) {
      dataArr = [1, 1];
    } else {
      dataArr = originDataArr;
    }
    // 圆环颜色数组
    let colorDataArr = ["rgb(50, 194, 222)", "rgb(255, 113, 0)"];
    // 图例标题
    let title = ['微分兑换', '消费获取'];
    // 得到圆环弧度数组（起始弧度和结束弧度为一数组的二维数组）
    let angleDataArr = angleArr(dataArr);

    // 计算每个圆环的起始弧度和结束弧度
    function angleArr(arr) {
      var flag1 = (arr[0] / arr[1]) > (1 / 359);
      var flag2 = (arr[1] / arr[0]) > (1 / 359);
      if (flag1 && flag2) {
      } else if (flag1) {
        arr = [359, 1];
      } else {
        arr = [1, 359]
      }
      var res = mapReduce((p, c) => (+p + +c))(arr, 0),
        t = res.slice(-1)[0];
      res = res.map((c) => (c / t * Math.PI * 2) - 0.7854);
      res = devideArr(res, 2);
      return res;
    }

    function mapReduce(fun) {
      return function (arr, pre) {
        var res = [];
        if (pre === undefined) {
          pre = arr[0];
          arr = arr.slice(1);
        }
        res.push(pre);
        for (var k in arr) {
          pre = fun(pre, arr[k], k, arr);
          res.push(pre);
        }
        return res;
      }
    }

    function devideArr(arr, n) {
      var res = [],
        l = arr.length,
        i = 0;
      while (i + n <= l) {
        res.push(arr.slice(i, i + n))
        i++;
      }
      return res;
    }

    function drawRing(color, data, title, originDataArr) {
      // 获取canvas上下文
      let context = wx.createCanvasContext('ringCanvas');
      // 三种动画
      let tween = {
        easeIn: function (t, b, c, d) {
          return c * (t /= d) * t * t * t * t + b;
        },
        easeOut: function (t, b, c, d) {
          return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        },
        easeInOut: function (t, b, c, d) {
          if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
          return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        }
      };

      // 动画部分
      let timer = null,
        duration = 1000, // 动画时间
        start = +new Date(), // 开始时间
        dataAltArr = mapReduce((p, c) => (c[1] - c[0]))(data, 0).slice(1),
        copyData = data.slice(0).map(item => item.slice(0));

      timer = setInterval(function () {
        let t = +new Date();
        // 超过动画时长，清除定时器
        if (t > start + duration) {
          clearInterval(timer);
          draw(data, true);
          return;
        }
        copyData.forEach(function (v, i) {
          if (v[0] == v[1]) {
            return;
          }
          if (copyData[i - 1]) {
            v[0] = copyData[i - 1][1];
          }
          v[1] = v[0] + tween.easeInOut(t - start, 0, dataAltArr[i], duration);
        })
        draw(copyData);
      }, 17);

      // 画圆环
      function draw(cdata, drawLine) {
        for (var i = 0; i < cdata.length; i++) {
          var start = cdata[i][0], // 开始弧度
            // 结束弧度
            end = cdata[i][1],
            // 中间弧度
            cen = (start + end) / 2,
            // 填充的颜色
            _color = color[i];

          if (end - start < 0.01) {
            continue;
          }
          context.beginPath();
          context.arc(that.remSize(166), that.remSize(150), that.remSize(80), start, end, false);
          context.arc(that.remSize(166), that.remSize(150), that.remSize(40), end, start, true);
          context.closePath();
          context.setFillStyle(_color);
          context.fill();

          // 画完圆环之后画图例
          if (drawLine) {
            var lineStartX = that.remSize(166) + that.remSize(88) * Math.cos(cen),
              lineStartY = that.remSize(150) + that.remSize(88) * Math.sin(cen),
              delt = 10 * Math.pow(2, .5),
              firstLineX = lineStartX,
              secondLineX = firstLineX,
              firstLineY = lineStartY,
              titleX, originDataX;
            // 判断线条是往左边延伸还是右边延伸
            if (lineStartX > that.remSize(166)) {
              firstLineX += delt;
              secondLineX = firstLineX + that.remSize(64);
              titleX = secondLineX - that.remSize(46);
              let strLen = (originDataArr[i] + '').length - 4;
              originDataX = secondLineX - that.remSize(22) - strLen * 5;
            } else {
              firstLineX -= delt;
              secondLineX = firstLineX - that.remSize(64);
              titleX = secondLineX;
              originDataX = secondLineX;
            }

            if (lineStartY > that.remSize(150)) {
              firstLineY += delt;
            } else {
              firstLineY -= delt;
            }
            // 画线条
            context.beginPath();
            context.arc(lineStartX, lineStartY, 2, 0, 2 * Math.PI);
            context.fill();
            context.beginPath();
            context.moveTo(lineStartX, lineStartY);
            context.lineTo(firstLineX, firstLineY);
            context.lineTo(secondLineX, firstLineY);
            context.setStrokeStyle(_color);
            context.stroke();
            // 画微分数值
            context.setFillStyle('#333');
            context.setFontSize(10);
            context.fillText(originDataArr[i], originDataX, firstLineY - 6);
            // 画标题
            context.setFillStyle('#999');
            context.setFontSize(12);
            context.fillText(title[i], titleX, firstLineY + 16);
          }
        }
        context.draw();
      }
    }
    drawRing(colorDataArr, angleDataArr, title, originDataArr);
  },

  /**
   * 获取12个月的时间戳
   */
  getEachMonthTimestamp: function (len = 12) {
    let tempArr = [];
    let date = new Date();
    date.setMonth(date.getMonth() + 1, 1) //获取到当前月份,设置月份
    for (let i = 0; i < len; i++) {
      date.setMonth(date.getMonth() - 1) //每次循环一次 月份值减1
      let m = date.getMonth() + 1;
      // 得到一个完整的日期时间
      let dateStr = date.getFullYear() + "/" + (m) + "/02";
      m = m < 10 ? '0' + m : m;
      let item = {
        'month': m, // 月份
        'timestamp': (new Date(dateStr)).getTime() / 1000 // 得到时间戳
      };
      tempArr.push(item)
    }
    return tempArr;
  },

  /**
   * 每三位数字加上逗号
   */
  numToThousands: function (num) {
    // 转化为字符串
    let numStr = (num || 0) + '',
      dotIndex = numStr.indexOf('.'), // 小数的位置
      integerStr = '', // 整数部分
      decimalStr = ''; // 小数部分

    if (dotIndex != -1) { // 是小数
      integerStr = numStr.substring(0, dotIndex);
      decimalStr = numStr.substring(dotIndex);
    } else { // 是整数
      integerStr = numStr;
      decimalStr = '.00';
    }
    let len = integerStr.length,
      result = '';

    // 每三位加一个逗号
    while (len > 3) {
      result = ',' + integerStr.slice(-3) + result;
      integerStr = integerStr.slice(0, len - 3);
      len = integerStr.length;
    }
    if (numStr) {
      result = integerStr + result + decimalStr;
    }
    return result;
  },

  /**
   * 格式化日期时间
   */
  formatDate: function (timestamp, format) {
    var date = new Date(timestamp);
    var o = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
      "q+": Math.floor((date.getMonth() + 3) / 3),
      "S": date.getMilliseconds()
    }
    if (/(y+)/.test(format)) {
      format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - (RegExp.$1.length > 4 ? 4 : RegExp.$1.length)));
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
      }
    }
    return format;
  },

  /**
   * 适配canvas画图
   */
  remSize: function (num) {
    let scale = wx.getSystemInfoSync().windowWidth / 375;
    return num * scale;
  },
  /**
   * 显示toast
   */
  showToast: function (title, duration = 2000) {
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
})