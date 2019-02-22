var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    id: 0,
    selectmodel: "",
    order: {},
    formid: [],
    isFrom: true,
    goodsInfo: {},
    groupPrice: '',
    goodsPrice: '',
    kanfriends: [],
    cart_id_arr: [],
    kanprice: 0,
    description: '',
    num_of_people: 0,
    num: 0,
    status: "P",
    storeConfig: '',
    express_fee: 0,
    selectAddress: {
      id: 0
    },
    shop: {
      id: "0"
    },
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    useBalance: true,
    selectDiscountInfo: {},
    cashOnDelivery: false,
    is_self_delivery: 0,
    deliverytype: "express",
    noAdditionalInfo: true,
    totalPrice: 0,
    additional_info_obj: {},
    goodsType: '',
    selectDelivery: ''
  },
  additional_info: {},
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this,
      selectmodelObj = JSON.parse(options.selectmodel),
      goods_id = options.goodsid,
      activityid = options.activityid,
      team_token = options.team_token || '',
      groupType = options.groupType,
      limit_buy = options.limit_buy,
      model_id = selectmodelObj.modelId,
      isFrom = options.isFrom,
      selectmodel = selectmodelObj.models_text,
      session_key = wx.getStorageSync('session_key');
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.setData({
      selectmodel: selectmodel,
      team_token: team_token,
      model_id: model_id,
      goods_id: goods_id,
      activityid: activityid,
      num_of_people: options.group_buy_people,
      num: Number(options.num),
      limit_buy: limit_buy,
      isFrom: isFrom,
      groupType: groupType
    });
    that.getCalculationInfo();
    that.getAppECStoreConfig();
  },
  getAppECStoreConfig: function() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getAppECStoreConfig',
      success: function(res) {
        if (res.data.express == 0) {
          _this.getSelfDeliveryList();
        }
        _this.setData({
          storeConfig: res.data,
          is_self_delivery: res.data.express == 0 ? 1 : 0,
          storeStyle: _this.franchisee_id ? '' : res.data.color_config
        })
      }
    })
  },
  deliveryWayChange: function(event) {
    let type = event.currentTarget.dataset.type;
    if (this.data.selfPayOnDelivery == 0 && type) {
      this.setData({
        cashOnDelivery: false
      })
    }
    if (type == 1 && !this.data.selectDelivery) {
      this.getSelfDeliveryList();
    }
    this.setData({
      is_self_delivery: type
    })
    this.getCalculationInfo();
  },
  getSelfDeliveryList: function() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      success: function(res) {
        if (res.data.store_list_data && res.data.store_list_data.length == 1)
          _this.setData({
            selectDelivery: res.data.store_list_data[0]
          })
      }
    })
  },
  toDeliveryList: function() {
    let _this = this;
    let url = '';
    if (_this.franchisee_id) {
      url += '?franchiseeId=' + _this.franchisee_id;
      url += _this.data.selectDelivery.id ? '&deliveryId=' + _this.data.selectDelivery.id : '';
    } else {
      url += _this.data.selectDelivery.id ? '?deliveryId=' + _this.data.selectDelivery.id : '';
    }
    _this.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/goodsDeliveryList/goodsDeliveryList' + url);
    })
  },
  goToAdditionalInfo: function() {
    app.setGoodsAdditionalInfo(this.data.additional_info);
    this.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
    })
  },

  goToMyAddress: function() {
    var addressId = this.data.selectAddress && this.data.selectAddress.id;
    this.isFromSelectAddress = true;
    this.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
    })
  },
  clickMinusButton: function(e) {
    var index = e.currentTarget.dataset.index,
      num = this.data.num;
    if (+num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  inputBuyCount: function(e) {
    var count = +e.detail.value,
      goodsInfo = this.data.goodsInfo,
      limit_buy = +this.data.limit_buy,
      stock = +goodsInfo.stock;
    if (this.data.groupType != '4' && count > limit_buy && limit_buy != 0) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + this.data.limit_buy + '件）',
      });
      this.setData({
        num: limit_buy
      })
      return;
    }
    if (count == 0) {
      this.setData({
        num: 1
      });
      return;
    }
    if (count >= stock) {
      count = stock;
      app.showModal({
        content: '购买数量不能大于库存'
      });
    }
    this.setData({
      num: +count
    });
    this.getCalculationInfo();
  },
  clickPlusButton: function(e) {
    var index = e.currentTarget.dataset.index,
      stock = +this.data.goodsInfo.stock,
      limit_buy = +this.data.limit_buy,
      num = this.data.num;
    if (this.data.groupType != '4' && limit_buy !== '' && limit_buy != 0 && +num >= limit_buy) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',
      })
      this.setData({
        num: limit_buy
      })
      return;
    };
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type) {
    var goods = this.data.goodsInfo,
      stock = +goods.stock,
      currentNum = this.data.num,
      targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
      _this = this,
      data = {},
      param;

    if (targetNum == 0 && type == 'minus') {
      this.setData({
        num: 1
      })
      return;
    }
    if (targetNum > stock) {
      app.showModal({
        content: '购买数量不能大于库存'
      })
      this.setData({
        num: stock
      })
      return;
    }
    this.setData({
      num: targetNum
    })
    this.getCalculationInfo();

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  getCalculationInfo: function() {
    var _this = this,
      goods_id = _this.data.goods_id,
      activity_id = _this.data.activityid,
      model_id = _this.data.model_id;

    app.sendRequest({
      url: '/index.php?r=appGroupBuy/calculatePrice',
      method: 'post',
      data: {
        goods_id: goods_id,
        activity_id: activity_id,
        model_id: model_id,
        address_id: this.data.selectAddress && this.data.selectAddress.id,
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        select_benefit: this.data.selectDiscountInfo,
        num_of_people: this.data.num_of_people,
        num: this.data.num,
        team_token: this.data.team_token || '',
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info
      },
      success: function(res) {
        if (typeof(res.data) == 'string') {
          if (!_this.data.isFrom && res.data == '已达到抽奖机会购买上限') {
            app.showModal({
              content: res.data
            })
            _this.setData({
              num: 1
            })
            return;
          } else {
            app.showModal({
              content: res.data,
              confirm: function() {
                app.turnBack();
              }
            })
            return;
          }
        }

        let info = res.data;
        let benefits = info.benefit;
        let goods_info = info.goods_info;
        let additional_info_goods = [];
        let selectDiscountInfo = info.select_benefit;
        let suppInfoArr = [];
        let additional_goodsid_arr = [];

        let goodsBenefitsData = [],
          goodsPrice = goods_info.virtual_price == '0.00' ? goods_info.original_price : goods_info.virtual_price,
          groupPrice = info.original_price;
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({
          label: 'coupon',
          value: benefits.coupon_benefit
        }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({
          label: 'vip',
          value: benefits.all_vip_benefit
        }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({
          label: 'integral',
          value: [benefits.integral_benefit]
        });

        // 优惠券：兑换券操作
        if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false) {
          _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }
        if (goods_info.delivery_id && goods_info.delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info.id) == -1) {
          suppInfoArr.push(goods_info.delivery_id);
          additional_goodsid_arr.push(goods_info.goods_id);
          additional_info_goods.push(goods_info);
        }
        let group_buy_price = String(info.original_price - info.group_buy_discount_price);
        if (group_buy_price.split('.')[1]) {
          group_buy_price = Number(group_buy_price).toFixed(2);
        }
        if (suppInfoArr.length && !_this.data.deliverydWrite) {
          _this.getSuppInfo(suppInfoArr);
        }
        _this.setData({
          goodsPrice: goodsPrice,
          groupPrice: groupPrice,
          goodsInfo: goods_info,
          isFrom: false,
          selectAddress: info.address,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          express_fee: info.express_fee,
          discount_price: info.discount_price,
          balance: info.balance,
          deduction: info.use_balance,
          totalPrice: info.final_price,
          original_price: info.original_price,
          group_buy_price: group_buy_price,
          totalPayment: info.final_price,
          noAdditionalInfo: suppInfoArr.length ? false : true,
          cashOnDelivery: info.price > 0 ? _this.data.cashOnDelivery : false,
          additional_goodsid_arr: additional_goodsid_arr
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      },
      fail: function() {
        app.turnBack();
      }
    });
  },
  commentChange: function(e) {
    var value = e.detail.value;
    if (value.length > 30) {
      app.showModal({
        content: '最多只能输入30个字'
      });
      value = value.slice(0, 30);
    }
    this.setData({
      description: value
    })
  },
  // 补充信息
  inputFormControl: function (e) {
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    a[b][0].value = e.detail.value
    this.setData({
      additional_info: a
    })
  },
  getSuppInfo: function(suppInfoArr) {
    var _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr
      },
      success: function(res) {
        for (let i = 0; i < res.data.length; i++) {
          let suppInfo = res.data[i].delivery_info;
          for (let j = 0; j < suppInfo.length; j++) {
            if (suppInfo[j].is_required == 0 && suppInfo[j].is_hidden == 1) {
              _this.setData({
                hasRequiredSuppInfo: true
              })
            }
          }
        } // 单商品单补充信息时直接展示
        if (res.data.length == 1 && _this.data.additional_goodsid_arr.length == 1) {
          let deliveryIndex = 0;
          let showIndex = 0;
          res.data[0].delivery_info.map((item) => {
            showIndex++;
            if (item.is_hidden == 1) {
              deliveryIndex++;
            }
          })
          if (deliveryIndex == 1) {
            let data = {};
            data[_this.data.additional_goodsid_arr[0]] = [];
            data[_this.data.additional_goodsid_arr[0]].push({
              title: res.data[0].delivery_info[showIndex - 1].name,
              type: res.data[0].delivery_info[showIndex - 1].type,
              is_required: res.data[0].delivery_info[showIndex - 1].is_required,
              value: ''
            })
            _this.setData({
              additional_info: data,
              aloneDeliveryShow: true
            })
          }
        }
      }
    })
  },
  confirmPayment: function(e) {
    let formid = this.data.formid,
    _this = this;
    formid.push(e.detail.formId);
    var list = this.data.goodsList,
      that = this,
      select_benefit = this.data.selectDiscountInfo,
      hasWritedAdditionalInfo = false;

    if (this.data.is_self_delivery == 0 && this.data.selectAddress && !this.data.selectAddress.id) {
      app.showModal({
        content: '请选择地址'
      });
      return;
    }
    if (this.data.is_self_delivery == 1 && !this.data.selectDelivery.id) {
      app.showModal({
        content: '请选择上门自提地址'
      });
      return;
    }

    for (var key in this.additional_info) {
      if (key !== undefined) {
        hasWritedAdditionalInfo = true;
        break;
      }
    }
    if (this.data.hasRequiredSuppInfo && !this.data.deliverydWrite && !this.data.aloneDeliveryShow) {
      app.showModal({
        content: '商品补充信息未填写，无法进行支付',
        confirmText: '去填写',
        confirmColor: _this.data.storeStyle.theme,
        confirm: function() {
          _this.goToAdditionalInfo();
        }
      });
      return;
    }
    if (this.data.aloneDeliveryShow) {
      let a = this.data.additional_info;
      let id = this.data.additional_goodsid_arr[0];
      if (a[id][0].is_required == 0 && a[id][0].value == '') {
        app.showModal({
          content: '请填写' + a[id][0].title,
          confirmText: '确认',
          confirmColor: _this.data.storeStyle.theme,
        });
        return;
      }
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    var data = {

    }
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/addOrder',
      method: 'post',
      data: {
        goods_id: that.data.goods_id,
        activity_id: that.data.activityid,
        model_id: that.data.model_id || 0,
        num: that.data.num,
        num_of_people: that.data.num_of_people,
        team_token: that.data.team_token || '',
        formId: e.detail.formId,
        select_benefit: that.data.selectDiscountInfo,
        is_balance: that.data.useBalance ? 1 : 0,
        is_self_delivery: that.data.is_self_delivery,
        self_delivery_app_store_id: that.data.is_self_delivery == 1 ? that.data.selectDelivery.id : '',
        remark: that.data.description,
        address_id: (that.data.selectAddress && that.data.selectAddress.id) || that.data.selectDelivery.id,
        is_pay_on_delivery: that.data.cashOnDelivery ? 1 : 0,
        additional_info: that.data.additional_info,
        express_fee: that.data.express_fee,
      },
      success: function(res) {
        var data = res.data;
        if (res.status == 0) {
          if (that.data.cashOnDelivery) {
            let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token;
            that.saveUserFormId(function() {
              app.turnToPage(pagePath);
            })
          } else {
            that.payOrder(res.data.order_id, res.data.team_token);
          }
          that.setData({
            team_token: res.data.team_token
          })
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
  additionInfo: function(orderId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/info',
      data: {
        additional_info: this.additional_info,
        order_id: orderId
      },
      success: function(res) {

      }
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
      app.sendRequest({
        url: '/index.php?r=appShop/cancelOrder',
        data: {
          order_id: orderId
        }
      })
      app.turnBack();
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
          payFail(orderId);
        },
        successStatusAbnormal: function() {
          payFail(orderId);
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
  showMemberDiscount: function() {
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function(event) {
    this.setData({
      selectDiscountInfo: event.detail.selectedDiscount.name == '无' ? 'no_use_benefit' : event.detail.selectedDiscount,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  useBalanceChange: function(e) {
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  useCashDelivery: function(e) {
    if (this.data.selfPayOnDelivery == 0 && e.detail.value) {
      this.setData({
        is_self_delivery: false
      })
    }
    this.setData({
      cashOnDelivery: e.detail.value
    })
    this.getCalculationInfo();
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
  addDeliveryImg: function () {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let images = a[b][0].value || [];

    app.chooseImage((image) => {
      a[b][0].value = images.concat(image);
      _this.setData({
        additional_info: a
      })
    }, 9)
  },
  deleteImage: function (e) {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let index = e.currentTarget.dataset.imageIndex;
    let images = a[b][0].value;

    images.splice(index, 1);
    a[b][0].value = images;
    _this.setData({
      additional_info: a
    })
  },
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    if (this.isFromSelectAddress) {
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
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
})