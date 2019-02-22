let app = getApp();
Component({
  properties: {
    discountType: {            // 优惠类型+优惠对应的数据 默认全部开启 value是优惠列表数据
      type: Array,
      value: [{
        label: 'coupon',
        value: []
      }, {
        label: 'vip',
        value: []
      }, {
        label: 'integral',
        value: []
      }]
    },
    franchisee: {
      type: String,
      value: ''
    }
  },

  data: {
    isVisibled: false,         // 弹窗开关
    isShowTip: true,           // 是否显示提示语 默认开启
    tipName: '',               // 提示语
    selectedDiscount: {},      // 选中的优惠
    currentDiscount: {         // 当前选中优惠的类型和下标
      type: '',
      index: 0,
    },
    isShowTarbar: true,
    currentTab: '',            // 当前选中的tab
    appLogo: app.globalData.appLogo
  },
  ready: function () {    
  },
  methods: {
    showDialog: function (selectedDiscount, franchisee = '') {
      this.getAppECStoreConfig();
      let discountType = selectedDiscount.discount_type;
      let currentDiscount = this.data.currentDiscount;
      let currentTab = this.data.currentTab;
      let num = 0;
      
      if(!discountType){
        let discount_type = '';
        this.data.discountType.map((val) => {
          if(val.value.length > 0){
            discount_type = val.label
          }
        })
        this.setData({
          isVisibled: true,
          selectedDiscount: {
            discount_type: discount_type,
            currentTab: discount_type,
            franchisee: franchisee
          }
        })
        return;
      }
      this.data.discountType.map((val) => {
        if(val.label === discountType || (val.label === 'vip' && discountType === 'paid_vip') || (val.label === 'vip' && discountType === 'vip_benefit_day')){
          if(selectedDiscount.no_use_benefit === 1){
            currentDiscount = {
              type: '',
              index: 0
            }
            currentTab = discountType;
            return;
          }
          if(discountType === 'coupon'){
            val.value.forEach((item, index) => {
              if(item.coupon_id == selectedDiscount.coupon_id){
                currentDiscount = {
                  type: 'coupon',
                  index: index
                };
                currentTab = 'coupon';
              }
            })
          } else if(discountType === 'vip' || discountType === 'paid_vip' || discountType === 'vip_benefit_day') {
            val.value.forEach((item, index) => {
              if(item.vip_id == selectedDiscount.vip_id && item.discount_type == selectedDiscount.discount_type){
                currentDiscount = {
                  type: 'vip',
                  index: index
                };
                currentTab = 'vip';
              }
            })
          } else if(discountType === 'integral') {
            currentDiscount = {
              type: 'integral',
              index: 0
            };
            currentTab = 'integral';
          }
        }
        if(val.value instanceof Array && val.value.length > 0){
          num++
        }
      })
      this.tipNameInit();
      this.setData({
        isVisibled: true,
        selectedDiscount: selectedDiscount,
        currentDiscount: currentDiscount,
        currentTab: currentTab,
        isShowTarbar: num !== 1
      })
    },
    tipNameInit: function () {
      let tipName = [];
      this.data.discountType.map((val) => {
        if (val.label === 'coupon' && val.value.length) {
          tipName.push('优惠券');
        } else if (val.label === 'vip' && val.value.length) {
          tipName.push('会员卡');
        } else if (val.label === 'integral' && val.value.length) {
          tipName.push('积分');
        }
      })
      this.setData({
        tipName: tipName.length > 1 ? tipName.join('、') : ''
      })
    },
    // 选择优惠
    selectedDiscount: function (e) {
      let type = e.currentTarget.dataset.type;
      let index = e.currentTarget.dataset.index;
      let selectedDiscount = this.data.selectedDiscount;
      let currentDiscount = this.data.currentDiscount;

      this.data.discountType.map((val) => {
        if (val.label === type) {
          if(type === currentDiscount.type && index === currentDiscount.index){    // 反选不使用优惠
            if(selectedDiscount.type === 'combine'){
              selectedDiscount.no_use_benefit = 1;
            }else {
              selectedDiscount = {
                title: "不使用优惠",
                name: '无',
                no_use_benefit: 1
              };
            }
            currentDiscount = {
              type: '',
              index: 0,
            }
          }else {
            if(selectedDiscount.type === 'combine'){
              selectedDiscount.no_use_benefit = 0;
              selectedDiscount.discount_type === 'coupon' ? selectedDiscount.coupon_id = val.value[index].coupon_id : '';
              if(selectedDiscount.discount_type === 'vip' || selectedDiscount.discount_type === 'paid_vip' || selectedDiscount.discount_type === 'vip_benefit_day'){
                selectedDiscount.discount_type = val.value[index].discount_type
                selectedDiscount.vip_id = val.value[index].vip_id
              }
            }else {
              selectedDiscount = val.value[index];
            }
            currentDiscount = {
              type: type,
              index: index
            }
          }

          this.setData({
            selectedDiscount: selectedDiscount,
            currentDiscount: currentDiscount
          })
        }
      })

      this.triggerEvent('afterSelectedDiscount', { selectedDiscount: selectedDiscount });

      this.setData({
        isVisibled: false
      })
    },
    hiddenDialog: function (e) {
      if(e.target.dataset.type === 'close'){
        this.setData({
          isVisibled: false
        })
      }
    },
    // 不使用优惠
    noUseDiscount: function () {
      let selectedDiscount = this.data.selectedDiscount;
      if(selectedDiscount.type === 'combine'){
        selectedDiscount.no_use_benefit = 1;
      }else {
        selectedDiscount = {
          title: "不使用优惠",
          name: '无',
          no_use_benefit: 1
        };
      }
      this.setData({
        selectedDiscount: selectedDiscount,
        currentDiscount: {
          type: '',
          index: 0,
        },
        isVisibled: false
      })
      this.triggerEvent('afterSelectedDiscount', { selectedDiscount: selectedDiscount });
    },
    // 导航选择
    checkType: function (e) {
      let label = e.currentTarget.dataset.label;

      this.setData({
        currentTab: label
      });
    },
    isShowTipChange: function () {
      this.setData({ isShowTip: false })
    },
    // 获取用户会员卡信息
    getVipCardInfo: function(){
      let _this = this;
      app.sendRequest({
        url: '/index.php?r=AppShop/GetVIPInfo',
        data: {
          sub_shop_app_id: _this.data.franchisee
        },
        hideLoading: true,
        success: (res) => {
          let discountType = _this.data.discountType;
          discountType.map((val) => {
            if(val.label === 'vip'){
              // val.value[0].logo = res.data.logo
            }
          })
          _this.setData({
            discountType: discountType
          })
        }
      })
    },
    getAppECStoreConfig: function () {
      app.getAppECStoreConfig((res) => {
        this.setData({
          storeStyle: res.color_config
        })
      }, this.data.franchiseeId);
    },
  }
})
