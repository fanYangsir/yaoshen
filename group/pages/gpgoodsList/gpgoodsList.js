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
      goods_list: [],
      is_more: 1,
      curpage:1,
      loading:false,
      loadingFail: false
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
    var _this = this;
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
          compid = 'goodsData',
          goodsList = this.data.goodsData.goods_list,
          length = goodsList.length,
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
          f.server_time = res.current_time;
          f.seckill_end_time = utils.formatTime(new Date(f.end_date * 1000));
          f.seckill_start_time = utils.formatTime(new Date(f.start_date * 1000));
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
          if (f.status == 0 || f.status == 1 || f.status == 2) {
            dc = app.beforeGroupDownCount(f, _this, compid + '.goods_list[' + (i + length) + ']');
          } else if (f.status == 3) {
            if (f.end_date != '-1') {
              dc = app.duringGroupDownCount(f, _this, compid + '.goods_list[' + (i + length) + ']');
            }
          }
          dc && downcountArr.push(dc);
        }
        var dataArr = res.data;
        newdata[compid + '.goods_list'] = goodsList.concat(dataArr);
        newdata[compid + '.is_more'] = res.is_more;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.isMore = res.is_more;
      }
    })
  },
  getMore: function () {
    this.loadList();
  },
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset;
  },
  remainMe(e) {
      data = e.currentTarget.dataset;
    app.sendRequest({
      url: '/index.php?r=appShop/careActivity',
      data: {
        data_id: data.goodsid,
        activity_id: data.activityid,
        activity_type: 0
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
    this.isMore = 1;
    this.loadList();
    this.pullRefreshTime = setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 3000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.isMore) {
      this.getMore();
    }
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})