let app = getApp();
Component({
  properties: {},
  data: {
    isVisibled: false,
    showBuyNow: false,
    showVirtualPrice: false,
    goodsInfo: {},
    selectGoodsModelInfo: {}    
  },
  goodsId: '',
  franchiseeId: '',
  ready: function () {
  },
  methods: {
    showDialog: function(data){
      this.goodsId = data.goodsId;
      this.franchiseeId = data.franchisee || ''
      this.setData({
        showBuyNow: data.showBuynow,
        showVirtualPrice: data.showVirtualPrice
      })
      this.getGoodsDetail();
      this.getAppECStoreConfig();
    },
    getGoodsDetail: function () {
      let _this = this;
      app.sendRequest({
        url: '/index.php?r=AppShop/getGoods',
        data: {
          data_id: _this.goodsId,
          sub_shop_app_id: this.franchiseeId
        },
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let goods = res.data[0].form_data;
            let defaultSelect = goods.model_items[0];
            let goodsModel = [];
            let selectModels = [];
            let goodprice = 0;
            let goodstock = 0;
            let goodid;
            let selectText = '';
            let goodimgurl = '';
            let virtual_price = '';
            if (goods.model_items.length) {
              goodprice = defaultSelect.price;
              goodstock = defaultSelect.stock;
              goodid = defaultSelect.id;
              goodimgurl = defaultSelect.img_url;
              virtual_price = defaultSelect.virtual_price;
            } else {
              goodprice = goods.price;
              goodstock = goods.stock;
              goodimgurl = goods.cover;
              virtual_price = goods.virtual_price;
            }
            for (let key in goods.model) {
              if (key) {
                let model = goods.model[key];
                goodsModel.push(model);
                selectModels.push(model.subModelId[0]);
                selectText += '“' + model.subModelName[0] + '” ';
              }
            }
            goods.model = goodsModel;

            _this.setData({
              isVisibled: true,
              goodsInfo: goods,
              'selectGoodsModelInfo.price': goodprice,
              'selectGoodsModelInfo.stock': goodstock,
              'selectGoodsModelInfo.buyCount': 1,
              'selectGoodsModelInfo.buyTostoreCount': 0,
              'selectGoodsModelInfo.cart_id': '',
              'selectGoodsModelInfo.models': selectModels,
              'selectGoodsModelInfo.modelId': goodid || '',
              'selectGoodsModelInfo.models_text': selectText,
              'selectGoodsModelInfo.imgurl': goodimgurl,
              'selectGoodsModelInfo.virtual_price': virtual_price,
              'selectGoodsModelInfo.max_can_use_integral': goods.max_can_use_integral
            });
          }
        }
      });
    },
    selectGoodsSubModel: function (event) {
      let dataset = event.target.dataset;
      let modelIndex = dataset.modelIndex;
      let submodelIndex = dataset.submodelIndex;
      let data = {};
      let selectModels = this.data.selectGoodsModelInfo.models;
      let model = this.data.goodsInfo.model;
      let text = '';

      selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];

      //拼已选规格文字
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if (selectModels[i] == selectSubModelId[j]) {
            text += '“' + model[i].subModelName[j] + '” ';
          }
        }
      }
      data['selectGoodsModelInfo.models'] = selectModels;
      data['selectGoodsModelInfo.models_text'] = text;

      this.setData(data);
      this.resetSelectCountPrice();
    },
    resetSelectCountPrice: function () {
      let selectModelIds = this.data.selectGoodsModelInfo.models.join(',');
      let modelItems = this.data.goodsInfo.model_items;
      let data = {};
      let cover = this.data.goodsInfo.cover;

      data['selectGoodsModelInfo.buyCount'] = 1;
      data['selectGoodsModelInfo.buyTostoreCount'] = 0;
      for (let i = modelItems.length - 1; i >= 0; i--) {
        if (modelItems[i].model == selectModelIds) {
          data['selectGoodsModelInfo.stock'] = modelItems[i].stock;
          data['selectGoodsModelInfo.price'] = modelItems[i].price;
          data['selectGoodsModelInfo.modelId'] = modelItems[i].id || '';
          data['selectGoodsModelInfo.imgurl'] = modelItems[i].img_url || cover;
          data['selectGoodsModelInfo.virtual_price'] = modelItems[i].virtual_price
          break;
        }
      }
      this.setData(data);
    },
    inputBuyCount: function (e) {
      this.setData({
        'selectGoodsModelInfo.buyCount': e.detail.value
      })
    },
    clickGoodsMinusButton: function (event) {
      let count = this.data.selectGoodsModelInfo.buyCount;
      if (count <= 1) {
        return;
      }
      this.setData({
        'selectGoodsModelInfo.buyCount': count - 1
      });
    },
    clickGoodsPlusButton: function (event) {
      let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
      let count = selectGoodsModelInfo.buyCount;
      let stock = selectGoodsModelInfo.stock;

      if (count >= stock) {
        return;
      }
      this.setData({
        'selectGoodsModelInfo.buyCount': count + 1
      });
    },
    sureAddToShoppingCart: function () {
      let _this = this;
      let param = {
        goods_id: _this.data.goodsInfo.id,
        model_id: _this.data.selectGoodsModelInfo.modelId || '',
        num: _this.data.selectGoodsModelInfo.buyCount,
        sub_shop_app_id: this.franchiseeId,
        message_notice_type: 1
      };

      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        success: function (res) {
          _this.triggerEvent('afterSelectedGoods', {});
          _this.hideDialog();
        }
      })
    },
    hideDialog: function () {
      this.setData({
        isVisibled: false,
      });
    },
    getAppECStoreConfig: function () {
      app.getAppECStoreConfig((res) => {
        this.setData({
          storeStyle: res.color_config
        })
      }, this.franchiseeId);
    },
    goPreviewGoodsOrder: function() {
      let _this = this;
      let param = {
        goods_id: _this.data.goodsInfo.id,
        model_id: _this.data.selectGoodsModelInfo.modelId || '',
        num: _this.data.selectGoodsModelInfo.buyCount,
        sub_shop_app_id: this.franchiseeId,
        message_notice_type: 1

      };
      
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        success: function (res) {
          let cart_arr = [res.data],
            pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr);
            _this.hideDialog();
            app.turnToPage(pagePath);
        }
      })
    }
  }
})
