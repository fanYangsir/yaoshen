var app = getApp()

Component({
  properties: {
    formInfo: {
      type: Object,
      value: {
        price: 0,
        form_data: {},
      }
    }
  },
  data: {
    formInfo: {
      price: 0,
      form_data: {}
    },
    buttonInfo: '',
  },
  methods: {
    discountChange: function (e) {
      var index = +e.detail.value;

      this.setData({
        'formInfo.selectDiscountInfo': this.data.formInfo.discountList[index] || '',
        'formInfo.selectDiscountIndex': index,
        'formInfo.calculData.selected_benefit': this.data.formInfo.discountList[index] || ''
      })
      this.calculateTotalPrice();
    },
    closeDialog: function(){
      this.setData({
        'formInfo.show' : false,
        'formInfo.useBalance': false
      });
      let thisPage = app.getAppCurrentPage();
      thisPage.setData({
        'formInfo.show': false
      })
    },
    inputRemark: function (e) {
      this.setData({
        remark : e.detail.value
      })
    },
    confirmPay: function () {
      let _this = this;
      let inputPrice = +this.data.formInfo.price;
      let totalPayment = this.data.formInfo.totalPayment;
      let benefits = this.data.formInfo.selectDiscountInfo;
      if (isNaN(totalPayment) || totalPayment < 0) {
        alertTip('error payment amount');
        return;
      }

      if (this.data.requesting) {
        return;
      }
      this.setData({
        requesting: true
      });

      if (benefits.no_use_benefit == 1) {
        benefits = '';
      }

      app.sendRequest({
        url: '/index.php?r=AppShop/createTransferOrder',
        method: 'post',
        data: {
          price: inputPrice,
          check_price: totalPayment,
          message: this.data.remark,
          selected_benefit: benefits,
          is_balance: this.data.formInfo.useBalance == true ? 1 : 0,
          form_info: this.data.formInfo.submitData
        },
        success: function (res) {
          _this.setData({
            'formInfo.submitData.button_info.order_id': res.data
          })
          _this.payOrder(res.data);
        },
        fail: function(){
          _this.setData({
            requesting: false
          });
        }
      })
    },
    payOrder: function (orderId) {
      var _this = this;
      function paySuccess(){
        let newData = {
          'formInfo.show': false,
          remark: '',
          'formInfo.useBalance': false,
        };
        app.getAppCurrentPage().setData(newData);
        _this.setData({
          requesting: false
        });
        app.addFormDataSuccess(_this.data.buttonInfo,{msg: ''})
      } 

      function payFail() {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId
          },
          success: function (res) {
            
          },
          fail: function () {
            payFail();
          },
          complete: function () {
            _this.setData({
              requesting: false
            });
          }
        })
      }

      if (this.data.formInfo.totalPayment == 0) {
        app.sendRequest({
          url: '/index.php?r=AppShop/paygoods',
          data: {
            order_id: orderId,
            total_price: 0
          },
          success: function (res) {
            paySuccess();
          },
          fail: function () {
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
        success: function (res) {
          var param = res.data;

          param.orderId = orderId;
          param.goodsType = 5;
          param.success = paySuccess;
          param.fail = payFail;
          app.wxPay(param);
        },
        complete: function(){
          let newData = {
            'formInfo.show': false,
            remark: '',
            'formInfo.useBalance': false
          };
          _this.setData({
            requesting: false
          });
          app.getAppCurrentPage().setData(newData);
        }
      })
    },
    calculateTotalPrice: function (options) {
      if(options){
        this.setData({
          buttonInfo: options
        })
      }
      let _this = this;
      let price = +this.data.formInfo.price;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/calculationPrice',
        method: 'post',
        data: this.data.formInfo.calculData,
        success: function (res) {
          let data = res.data;
          let benefits = data.can_use_benefit.data;
          let selected_benefit;
          let selectDiscountIndex;

          if (benefits.length) {
            benefits.unshift({
              title: '不使用优惠',
              name: '无',
              no_use_benefit: 1
            });
          }
          
          selected_benefit = data.selected_benefit_info;
          for (let i = 0; i <= benefits.length - 1; i++) {
            let select_discount_type = selected_benefit.discount_type;
            if (select_discount_type === benefits[i].discount_type) {
              if (select_discount_type === 'coupon') {
                if (benefits[i].coupon_id == selected_benefit.coupon_id) {
                  selectDiscountIndex = i;
                  break;
                }
              } else {
                selectDiscountIndex = i;
                break;
              }
            }
          }

          _this.setData({
            'formInfo.totalPayment': data.price,
            'formInfo.discountList': benefits,
            'formInfo.selectDiscountInfo': selected_benefit,
            'formInfo.selectDiscountIndex': selectDiscountIndex || '',
            'formInfo.balance': data.balance,
            'formInfo.use_balance_count': data.use_balance,
            'formInfo.discount_cut_price': data.discount_cut_price 
          });
        }
      })
    },
    ifUseBalance: function (e) {
      this.setData({
        'formInfo.useBalance': e.detail.value,
        'formInfo.calculData.is_balance': e.detail.value == true ? 1 : 0
      })
      this.calculateTotalPrice();
    }
  }
})