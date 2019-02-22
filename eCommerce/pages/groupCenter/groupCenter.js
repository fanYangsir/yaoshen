var app = getApp();
var utils = require('../../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    status: 4,
    formid: [],
    goodsData: {
      goods_list: []
    }
  },
  page: 1,
  isMore: 1,
  seckillFunc: [],
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var _this = this;
    _this.pageInit();
  },
  pageInit() {
    var _this = this;
    if (app.isLogin()) {
      _this.loadAll();
    } else {
      app.goLogin({
        success: function () {
          _this.loadAll();
        }
      });
    }
  },
  loadAll() {
    var _this = this;
    _this.loadList();
  },
  loadList() {
    let _this = this;
    let goodsData = this.data.goodsData;
    if (goodsData.is_more == 0 || goodsData.loading){
      return;
    }
    _this.setData({
      'goodsData.loading': true
    });
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      data: {
        page: _this.page,
        page_size: 10,
        status: 0,
        sub_app_id: _this.data.franchisee
      },
      success: res => {
        let rdata = res.data,
          newdata = {},
          oldData = _this.data.goodsData.goods_list || [],
          oldLen = oldData.length,
          downcountArr = _this.downcountArr || [];

        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i],
            dc;

          f.description = '';
          f.downCount = {
            hours: '00',
            minutes: '00',
            seconds: '00'
          };
          f.server_time = (Date.parse(new Date()) / 1000);
          f.seckill_end_time = utils.formatTime(new Date(f.end_date * 1000));
          f.seckill_start_time = utils.formatTime(new Date(f.start_date * 1000));
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
          if (f.status == 0 || f.status == 1 || f.status == 2) {
            dc = app.beforeGroupDownCount(f, _this, 'goodsData.goods_list[' + (oldLen + i) + ']');
          } else if (f.status == 3) {
            if (f.end_date != '-1') {
              dc = app.duringGroupDownCount(f, _this, 'goodsData.goods_list[' + (oldLen + i) + ']');
            }
          }
          dc && downcountArr.push(dc);
        }
        if (_this.page == 1){
          oldData = [];
        }
        newdata['goodsData.goods_list'] = oldData.concat(rdata);
        newdata['goodsData.is_more'] = res.is_more;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.page++;
      },
      complete: function(){
        let newdata = {};
        newdata['goodsData.loading'] = false;
        _this.setData(newdata);
      }
    })
  },
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset;
    this.saveUserFormId(function () {
      var pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid;
      app.turnToPage(pageUrl)
    })
  },
  remainMe(e) {
    var _this = this,
      data = e.currentTarget.dataset,
      index = data.index,
      goodsList = _this.data.goodsData.goods_list;
    app.sendRequest({
      url: '/index.php?r=appShop/careActivity',
      data: {
        data_id: data.goodsid,
        activity_id: data.activityid,
        activity_type: 0
      },
      success: res => {
        for (var i = 0; i < goodsList.length; i++) {
          if (index == i) {
            app.showToast({
              title: '设置开团提醒成功！',
              duration: 2000
            });
            var newdata = {};
            newdata['goodsData.goods_list[' + i + '].status'] = 2
            this.setData(newdata)
          }
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.downcountArr && this.downcountArr.length) {
      this.downcountArr = this.downcountArr.concat().reverse();
      for (let i = 0; i < this.downcountArr.length; i++) {
        this.downcountArr[i] && this.downcountArr[i].clear();
      }
    }
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        form_id: _this.data.formid || []
      },
      complete: function () {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.page = 1;
    this.loadList();
    this.pullRefreshTime = setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 3000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadList();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})