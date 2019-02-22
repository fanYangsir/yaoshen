// Collage/index/index.js
var app = getApp();
var utils = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    addToGroupBuyCart: true,
    myTeams: {}, showTips: true,
    coverList: [],
    goodsData: {
      goods_list: [],
      is_more: 1,
      curpage: 1,
      loading: false,
      loadingFail: false
    },

    modelId: '',
    originPrice: 0,
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text: '',
      leader_price: 0,
      member_price: 0,
      num_of_people: 0,
      groupBuyCount: 1,
      groupNum: ''
    },
    status: 4,
    isParticipate: false,
    orderId: '',
    needNum: 0,
    formid: []
  },
  seckillFunc: [],
  page: 1,
  isMore: 1,
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      team_token: options.teamtoken,
      orderId: options.orderId
    })
    this.pageInit();
  },
  pageInit() {
    var _this = this;
    if (app.isLogin()) {
      _this.loadAll();
    } else {
      app.goLogin({
        success: function() {
          _this.loadAll();
        }
      });
    }
  },
  loadAll() {
    var _this = this;
    _this.loadMyTeams();
    _this.loadList();
  },
  participateGroup: function(e) {
    var franchiseeId = this.data.franchiseeId,
      that = this,
      selectmodel = JSON.stringify(this.data.selectModelInfo),
      goodsId = this.data.goodsId,
      activityId = this.data.activityId,
      num = this.data.selectModelInfo.groupBuyCount,
      numOfPeople = this.data.selectModelInfo.groupNum || '',
      sub_shop_app_id = franchiseeId || '',
      is_group_buy = 1,
      limit_buy = that.data.goods.user_limit_buy,
      team_token = that.data.team_token || '';
    if (that.data.goods.type == 3 && that.data.goods.is_leader == 0) {
      app.sendRequest({
        url: '/index.php?r=appGroupBuy/assist',
        method: 'post',
        data: {
          team_token: team_token,
        },
        success: function(res) {
          var data = res.data;
          if (res.status == 0) {
            if (that.data.cashOnDelivery) {
              let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token
              that.saveUserFormId(function() {
                app.turnToPage(pagePath, 1);
              })
            } else {
              that.payOrder(res.data.order_id, res.data.team_token);
            }

          } else {
            app.showModal({
              content: res.data
            });
            return
          }
        },
        fail: function() {
          that.requesting = false;
        },
        successStatusAbnormal: function() {
          that.requesting = false;
        }
      });
    } else {
      this.setData({
        addToGroupBuyCart: false,
        isParticipate: true,
        'selectModelInfo.groupNum': e.currentTarget.dataset.num,
        team_token: e.currentTarget.dataset.token
      })
      this.resetSelectCountPrice();
    }
  },
  resetSelectCountPrice: function () {
    var selectModelIds = this.data.selectModelInfo.models.join(','),
      modelItems = this.data.goodsInfo.model_items,
      discountInfo = this.data.discountInfo,
      discountInfoArr = [],
      data = {};

    for (var i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model) {
        if (modelItems[i].model == selectModelIds && modelItems[i].num_of_people == this.data.selectModelInfo.groupNum) {
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.member_price'] = modelItems[i].member_price;
          data['selectModelInfo.leader_price'] = modelItems[i].leader_price;
          data['selectModelInfo.modelId'] = modelItems[i].id || '';
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
          break;
        }
      } else {
        if (modelItems[i].num_of_people == this.data.selectModelInfo.groupNum) {
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.member_price'] = modelItems[i].member_price;
          data['selectModelInfo.leader_price'] = modelItems[i].leader_price;
          data['selectModelInfo.modelId'] = modelItems[i].id || '';
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
          break;
        }
      }
    }
    for (let i = 0; i < discountInfo.length; i++) {
      if (discountInfo[i].model_id == data['selectModelInfo.modelId']) {
        discountInfoArr.push(discountInfo[i])
      }
    }
    data['discountInfoArr'] = discountInfoArr;
    this.setData(data);
  },
  turnToGoodsDetail: function () {
    var pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id;
    this.saveUserFormId(function () {
      app.turnToPage(pageUrl)
    })
  },
  showGroupBuy: function() {
    if (this.data.goodsInfo.status == 4) {
      app.showModal({
        content: '当前拼团已结束，不能加入购物车'
      });
      return;
    }
    if (this.data.goodsInfo.status == 0) {
      app.showModal({
        content: '当前拼团活动未开启'
      })
      return;
    }
    this.setData({
      addToGroupBuyCart: false,
      ifOpenNewGroup: false,
      isParticipate: false,
      isShowTopBar: false
    })
  },
  hideMask: function () {
    this.setData({
      showTips: true
    })
  },
  showMoreTips: function () {
    var showTips = !this.data.showTips;
    this.setData({
      showTips: showTips
    })
  },
  loadMyTeams() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/teamInfo',
      data: {
        team_token: _this.data.team_token
      },
      success: res => {
        var coverList = [],
          myTeams = res.data,
          orderInfo = myTeams.order_info,
          orderId = this.data.orderId || '',
          coverObj = {},
          progress = parseInt(Number(res.data.current_user_count / res.data.max_user_num) * 100),
          maxNum = Number(myTeams.max_user_num) || 0,
          needNum = (maxNum - myTeams.current_user_count) || '',
          originPrice = myTeams.virtual_price == '0.00' ? myTeams.goods_price : myTeams.virtual_price;
          if(orderInfo){
            orderId = orderInfo.order_id;
          }
        if (myTeams.joined != '1' && myTeams.activity_type == '4') {
          var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?activity_id=' + myTeams.activity_id + '&goods_id=' + myTeams.goods_id;
          _this.saveUserFormId(function() {
            app.turnToPage(pathUrl);
          })
        }
        myTeams.downCount = {
          hours: '00',
          minutes: '00',
          seconds: '00'
        };
     
        if (myTeams.member) {
          var coverTotalArr = myTeams.member || '',
            coverArr = [],
            numLack = myTeams.activity_type == 3 ? ((maxNum - coverTotalArr.length) + 1) : (maxNum - coverTotalArr.length),
            numLen = 0,
            coverLoading = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/loading-portrait.png'
            },
            coverUser = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/missing-head.png'
            },
            coverSuccess = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/success-loading.png'
            };
          for (let arrIndex in coverTotalArr) {
            coverObj = {
              isNum: 1,
              image: coverTotalArr[arrIndex]
            }
            coverArr.push(coverObj)
          }
          if (maxNum > 5) {
            switch (coverArr.length) {
              case 1:
                numLen = 2;
                break;
              case 2:
                numLen = 1;
                break;
              case 3:
                numLen = 0;
                break;
            }
            if (coverArr.length < 3) { //显示3个用户+1个等待+1个用户
              coverList = coverArr;
              for (var i = 0; i < numLen; i++) {
                coverList.push(coverUser);
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 3 && coverArr.length < 5) {
              for (var index in coverArr) {
                if (index < 3) {
                  coverList.push(coverArr[index]);
                }
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 5) {
              if (coverArr.length < maxNum) {
                for (var index in coverArr) {
                  if (index < 3) {
                    coverList.push(coverArr[index]);
                  }
                }
                coverList.push(coverLoading);
                coverList.push(coverUser);
              } else {
                for (var index in coverArr) {
                  if (index < 4) {
                    coverList.push(coverArr[index])
                  }
                }
                coverList.push(coverSuccess);
              }


            }
          } else {
            coverList = coverArr;
            for (let i = 0; i < numLack; i++) {
              coverList.push(coverUser);
            }
          }

        }
        myTeams.server_time = res.current_time;
        myTeams.seckill_end_time = myTeams.expired_time;
        if (myTeams.current_status == 0 || myTeams.current_status == 1) {
          _this.downcount = _this.beforeGroupDownCount(myTeams, _this, 'myTeams');
        } else if (myTeams.current_status == 2) {
          _this.downcount = _this.duringGroupDownCount(myTeams, _this, 'myTeams');
        }
        if (res.data.enable_status == 1) {
          _this.loadGoods(myTeams.activity_id, myTeams.goods_id, _this.data.team_token, myTeams.max_user_num)
        }
        _this.setData({
          progress: progress,
          myTeams: myTeams,
          orderId: orderId,
          goodsId: myTeams.goods_id,
          activityId: myTeams.activity_id,
          orderInfo: orderInfo,
          member: coverList,
          originPrice: originPrice,
          needNum: needNum
        })
      }
    })
  },
  beforeGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_start_time,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 3;
        newData[path + '.current_status'] = 3;
        newData[path + '.server_time'] = formData.seckill_start_time;
        page.setData(newData);
        formData.server_time = formData.seckill_start_time;
        _this.downcount = _this.duringGroupDownCount(formData, page, path);
      }
    }, page, path + '.downCount');

    return downcount;
  },
  duringGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_end_time,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 4;
        newData[path + '.current_status'] = 4;
        page.setData(newData);
        if (path == "myTeams") {
          page.loadMyTeams();
        }
      }
    }, page, path + '.downCount');

    return downcount;
  },
  loadGoods(activityId, goodsId, team_token, groupNum) {
    var _this = this,
      goodsModel = [],
      selectModels = [],
      modelStrs = {},
      description = '',
      modifySelectModels = '',
      price = 0,
      allStock = 0,
      selectStock, selectPrice, selectModelId, matchResult, selectVirtualPrice, selectText = '',
      selectGroupNum,
      leaderPrice, memberPrice, numOfPeople, i, j,
      selectImgurl = '';
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getGoods',
      data: {
        activity_id: activityId,
        goods_id: goodsId,
        team_token: team_token
      },
      success: res => {
        var goods = res.data.goods_info,
          groupData = res.data.group_buy_goods_info,
          discountInfo = groupData.discount_info,
          discountInfoArr = [],
          progress = Number(res.data.current_user_count / res.data.max_user_num) * 100,
          team_token = res.data.team_token,
          compid = 'goodsData';
        goods.description = '';
        goods.status = res.data.status;
        goods.virtual_price = goods.virtual_price == '0.00' ? '' : goods.virtual_price;
        for (var key in goods.model) {
          if (key) {
            var model = goods.model[key];
            goodsModel.push(model);
            if (model && model.subModelName) {
              modelStrs[model.id] = model.subModelName.join('、');
              selectModels.push(model.subModelId[0]);
              modifySelectModels = selectModels.toString();
              selectText += '“' + model.subModelName[0] + '” ';
            }
          }
        }
        if (goods.model_items.length) {
          var items = goods.model_items;
          for (i = 0, j = items.length; i < j; i++) {
            price = items[i].price;
            goods.highPrice = goods.highPrice > price ? goods.highPrice : price;
            goods.lowPrice = goods.lowPrice < price ? goods.lowPrice : price;
            allStock += Number(items[i].stock);
            if (i == 0) {
              selectPrice = price;
              selectGroupNum = Number(groupNum);
              memberPrice = items[i].member_price;
              leaderPrice = items[i].leader_price;
              selectStock = items[0].stock;
              selectModelId = items[0].id;
              selectImgurl = items[i].img_url;
              selectVirtualPrice = items[i].virtual_price != '0.00' ? items[i].virtual_price : ''
            }
          }
          allStock = allStock / groupData.num_of_people.length;
        } else {
          selectPrice = goods.price;
          selectStock = goods.stock;
          selectImgurl = goods.cover;
          selectGroupNum = Number(discountInfo[0].num_of_people || groupData.goods_num);
          memberPrice = discountInfo[0].member_price;
          leaderPrice = discountInfo[0].leader_price;
          selectVirtualPrice = goods.virtual_price != '0.00' ? goods.virtual_price : '';
        }
        for (var i = 0; i < discountInfo.length; i++) {
          if (discountInfo[i].model_id == selectModelId) {
            discountInfoArr.push(discountInfo[i]);
          }
        }
        goods.model = goodsModel;

        _this.setData({
          'selectModelInfo.models': selectModels || '',
          'selectModelInfo.stock': selectStock || '',
          'selectModelInfo.price': selectPrice || '',
          'selectModelInfo.groupNum': selectGroupNum || '',
          'selectModelInfo.modelId': selectModelId || '',
          'selectModelInfo.models_text': selectText || '',
          'selectModelInfo.imgurl': selectImgurl || '',
          'selectModelInfo.virtualPrice': selectVirtualPrice || '',
          'selectModelInfo.leader_price': leaderPrice,
          'selectModelInfo.member_price': memberPrice,
          'selectModelInfo.num_of_people': selectGroupNum,
          goods: res.data,
          goodsInfo: goods,
          discountInfoArr: discountInfoArr,
          team_token: team_token || '',
          groupInfo: groupData,
          discountInfo: groupData.discount_info,
          progress: progress
        })
       

      }
    })
  },
  sureJoinGroup: function(e) {
    var franchiseeId = this.data.franchiseeId,
      that = this,
      selectmodel = JSON.stringify(this.data.selectModelInfo),
      goodsId = this.data.goodsId,
      activityId = this.data.activityId,
      modelId = this.data.selectModelInfo.modelId || '',
      num = this.data.selectModelInfo.groupBuyCount,
      numOfPeople = this.data.selectModelInfo.groupNum || '',
      sub_shop_app_id = franchiseeId || '',
      is_group_buy = 1,
      limit_buy = that.data.goods.user_limit_buy,
      team_token = that.data.team_token || '';

    var
      pagePath = '/group/pages/previewGroupOrder/previewGroupOrder?goodsid=' + goodsId + '&activityid=' + this.data.activityId + '&num=' + num + '&modelId=' + modelId + '&numOfPeople=' + numOfPeople + '&is_group=true' + '&group_buy_people=' + that.data.selectModelInfo.groupNum + '&is_group_buy=' + is_group_buy + '&limit_buy=' + limit_buy + '&selectmodel=' + selectmodel + '&groupType=' + that.data.goods.type + '&team_token=' + team_token;
    that.saveUserFormId(function() {
      franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
      app.turnToPage(pagePath);
    })

  },
  payOrder: function(orderId, teamToken) {
    var that = this;

    function paySuccess() {
      var pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&teamToken=' + teamToken;
      if (!that.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            order_id: orderId
          },
          success: function(res) {
            if (res.valid == 0) {
              pagePath += '&collectBenefit=1';
            }
            that.saveUserFormId(function() {
              app.turnToPage(pagePath, 1);
            })
          }
        });
      } else {
        that.saveUserFormId(function() {
          app.turnToPage(pagePath, 1);
        })
      }
    }

    function payFail() {
      that.cancelOrder(orderId);
      if (this.data.myTeams.activity_type != 3){
        that.saveUserFormId(function () {
          that.setData({
            addToGroupBuyCart: false
          })
        })
      }
    }

    if (this.data.totalPayment == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res) {
          paySuccess();
        },
        fail: function() {
          payFail();
        },
        successStatusAbnormal: function() {
          payFail();
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function(res) {
        var param = res.data;

        param.orderId = orderId;
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        app.wxPay(param);
      },
      fail: function() {
        payFail();
      },
      successStatusAbnormal: function() {
        payFail();
      }
    })
  },
  cancelOrder(orderId) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/cancelOrder',
      data: {
        order_id: orderId
      }
    })
  },
  confirmPayment: function(e) {
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/addOrder',
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        activity_id: that.data.activityId,
        model_id: modelId = this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.groupBuyCount,
        num_of_people: this.data.selectModelInfo.groupNum || '',
        team_token: that.data.team_token || '',
        formId: e.detail.formId,
        select_benefit: that.data.selectDiscountInfo,
        is_balance: that.data.useBalance ? 1 : 0,
        is_self_delivery: that.data.is_self_delivery,
        self_delivery_app_store_id: that.data.is_self_delivery == 1 ? that.data.selectDelivery.id : '',
        remark: that.data.description,
        address_id: that.data.selectAddress.id || that.data.selectDelivery.id,
        is_pay_on_delivery: that.data.cashOnDelivery ? 1 : 0,
        additional_info: that.additional_info,
        express_fee: that.data.express_fee,
      },
      success: function(res) {
        var data = res.data;
        if (res.status == 0) {
          if (that.data.cashOnDelivery) {
            let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token;
            that.saveUserFormId(function() {
              app.turnToPage(pagePath, 1);
            })
          } else {
            that.payOrder(res.data.order_id, res.data.team_token);
          }

        } else {
          app.showModal({
            content: res.data
          });
          return
        }
      },
      fail: function() {
        that.requesting = false;
      },
      successStatusAbnormal: function() {
        that.requesting = false;
      }
    });

  },
  goToPlaylaws: function() {
    var path = '/group/pages/gpplaylaws/gpplaylaws?activityType=' + this.data.myTeams.activity_type + '&autoRefund=' + this.data.goods.auto_refund + '&refundMode=' + this.data.goods.refund_mode;
    this.saveUserFormId(function() {
      app.turnToPage(path);
    })
  },
  loadList() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      data: {
        page: _this.page,
        page_size: 4,
        status: 1,
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
          let f = rdata[i];
          f.description = '';
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
        }
        var dataArr = res.data;
        newdata[compid + '.goods_list'] = goodsList.concat(dataArr);
        newdata[compid + '.is_more'] = res.is_more;
        newdata[compid + '.curpage'] = 1;
        newdata[compid + '.loading'] = false;
        newdata[compid + '.loadingFail'] = false;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.page++;
        _this.isMore = res.is_more;
      }
    })
  },


  // 点击事件
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid;
    _this.saveUserFormId(function() {
      app.turnToPage(pageUrl)
    })
  },
  copyOrderId() {
    let _this = this;
    wx.setClipboardData({
      data: _this.data.orderId,
      success: function(res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  selectSubModel: function(e) {
    var dataset = e.target.dataset,
      modelIndex = dataset.modelIndex,
      submodelIndex = dataset.submodelIndex,
      data = {},
      selectModels = this.data.selectModelInfo.models,
      model = this.data.goodsInfo.model,
      text = '';

    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];

    // 拼已选中规格文字
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if (selectModels[i] == selectSubModelId[j]) {
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
  
    data['selectModelInfo.models'] = selectModels;
    data['selectModelInfo.models_text'] = text;

    this.setData(data);
    this.resetSelectCountPrice();
  },
  clickPlusButton: function (e) {
    var selectModelInfo = this.data.selectModelInfo,
      goodsInfo = this.data.goodsInfo,
      count = selectModelInfo.buyCount,
      limit_buy = +this.data.goods.user_limit_buy,
      stock = selectModelInfo.stock;
    if (limit_buy != 0 && selectModelInfo.buyCount >= limit_buy) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',

      });
      this.setData({
        'selectModelInfo.buyCount': limit_buy,
        'selectModelInfo.groupBuyCount': limit_buy
      })
      return;
    }
    if (count >= stock && this.data.goods.type != 4) {
      app.showModal({
        content: '购买数量不能大于库存'
      });
      this.setData({
        'selectModelInfo.buyCount': stock,
        'selectModelInfo.groupBuyCount': stock
      })
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1,
      'selectModelInfo.groupBuyCount': count + 1
    });
  },
  clickMinusButton: function(e) {
    var count = this.data.selectModelInfo.buyCount;

    if (count <= 1) {
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1,
      'selectModelInfo.groupBuyCount': count - 1
    });
  },
  inputBuyCount: function (e) {
    var count = +e.detail.value,
      selectModelInfo = this.data.selectModelInfo,
      goodsInfo = this.data.goodsInfo,
      stock = +selectModelInfo.stock,
      limit_buy = +this.data.goods.user_limit_buy;
    if (count > limit_buy && limit_buy != 0) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',
      });
      this.setData({
        'selectModelInfo.buyCount': +limit_buy,
        'selectModelInfo.groupBuyCount': +limit_buy
      })
      return;
    }
    if (count == 0) {
      this.setData({
        'selectModelInfo.buyCount': 1
      });
      return;
    }
    if (count >= stock) {
      app.showModal({
        content: '购买数量不能大于库存',
      });
      this.setData({
        'selectModelInfo.buyCount': +stock,
        'selectModelInfo.groupBuyCount': +stock
      });
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': +count,
      'selectModelInfo.groupBuyCount': +count
    });
  },
  hideGroupBuyCart: function() {
    this.setData({
      addToGroupBuyCart: true,
      isShowTopBar: true
    })
  },
  openNewGroup: function() {
    let myTeams = this.data.myTeams;
    if (myTeams.enable_status == '0') {
      app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + myTeams.goods_id);
      return;
    }
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id;
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  showMyTeamList() {
    this.saveUserFormId(function() {
      app.turnToPage('/group/pages/gpmyOrder/gpmyOrder');
    })
  },
  inviteFriends: function() {
    let that = this;
    let myTeams = this.data.myTeams;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getShareQRCode',
      data: {
        goods_id: myTeams.goods_id,
        activity_id: myTeams.activity_id,
        type: 6,
        text: myTeams.goods_title,
        price: myTeams.group_buy_price,
        virtual_price: that.data.originPrice,
        goods_img: myTeams.img_urls ? myTeams.img_urls[0] : myTeams.goods_cover,
        sub_shop_id: that.data.franchiseeId,
        user_token: app.globalData.PromotionUserToken || ''
      },
      success: function(res) {
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
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
      complete: function() {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })

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
    if (this.downcount) {
      this.downcount.clear();
    }
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
    if (this.isMore) {
      this.loadList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    var that = this,
      team_token = this.data.team_token,
      myTeams = this.data.myTeams,
      type = myTeams.activity_type,
      modelId = this.data.modelId,
      urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      url = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token + '&orderId=' +  that.data.orderId,
      nickname = app.getUserInfo('nickname'),
      share_cover = myTeams.share_cover ? myTeams.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      title = myTeams.share_title ? myTeams.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + that.data.myTeams.group_buy_price + '元拼' + that.data.myTeams.goods_title + '，火爆抢购中......';


    return app.shareAppMessage({
      title: title,
      path: url,
      imageUrl: share_cover,
      success: function(addTime) {
        app.showToast({
          title: '转发成功',
          duration: 500
        });
        // 转发获取积分
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=appShop/getIntegralLog',
          data: {
            add_time: addTime
          },
          success: function(res) {
            if (res.status == 0) {
              res.data && that.setData({
                'rewardPointObj': {
                  showModal: true,
                  count: res.data,
                  callback: ''
                }
              });
            }
          }
        })
      }
    });
  }
})