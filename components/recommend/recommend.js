var app = getApp();
var util = require('../../utils/util.js');
var eventSource = [{ action: "get-coupon", name: "优惠券详情", local_icon: "icon-news-coupon" }, { action: "goods-trade", name: "商品详情", local_icon: "icon-news-goodsdetail" }, { action: "community", name: "社区详情", local_icon: "icon-news-community" }, { action: "to-franchisee", name: "商家详情", local_icon: "icon-news-business" }, { action: "coupon-receive-list", name: "优惠券列表", local_icon: "icon-news-coupon" }, { action: "recharge", name: "储值", local_icon: "icon-news-storage" }, { action: "transfer", name: "付款", local_icon: "icon-news-payment" }, { action: "to-promotion", name: "代言人中心", local_icon: "icon-news-extension" }, { action: "scratch-card", name: "刮刮乐", local_icon: "icon-news-scratch" }, { action: "lucky-wheel", name: "大转盘", local_icon: "icon-news-turntable" }, { action: "golden-eggs", name: "砸金蛋", local_icon: "icon-news-goldegg" }, { action: "call", name: "拨打电话", local_icon: "icon-news-callphone" }, { action: "turn-to-xcx", name: "跳转action小程序", local_icon: "icon-news-jump" }, { action: "share", name: "分享好友", local_icon: "icon-news-sharefriends" }, { action: "page-share", name: "分享朋友圈", local_icon: "icon-news-sharecircle" }, { action: "refresh-list", name: "刷新列表", local_icon: "icon-news-refreshlist" }, { action: "refresh-page", name: "刷新页面", local_icon: "icon-news-refreshpage" }, { action: "contact", name: "联系客服", local_icon: "icon-news-custom" }, { action: "preview-picture", name: "预览大图", local_icon: "icon-news-coupon" }, { action: "to-seckill", name: "秒杀", local_icon: "icon-news-kill" }, { action: "video-detail", name: "视频详情", local_icon: "icon-news-videodetail" }, { action: "topic", name: "话题详情", local_icon: "icon-news-topic" }, { action: "news", name: "资讯详情", local_icon: "icon-news-news" }, { action: "goods-scan-code", name: "扫码购", local_icon: "icon-shopping-scan" }];
var customEvent = require('../../utils/custom_event.js');

Component({
  properties: {
    // 这里定义了传进来的对象属性，属性值可以在组件使用时指定
    franchiseeId: {
      type: String
    }
  },
  data: {
    recommendInfo: [],
    appLogo: ''
  },
  ready: function () {
    this.getAppECStoreConfig();
    this.setData({
      appLogo: app.globalData.appLogo
    })
  },
  methods: {
    getAppECStoreConfig: function () {
      app.getAppECStoreConfig((res) => {
        res.recommend_config && res.recommend_config.map((item) => {
          item.recommend_info = item.recommend_info.map(rg => {
            if (item.recommend_type == 3) {
              if (!rg.name) {
                rg.name = rg.pageRouterName ? rg.pageRouterName.split('/').pop() : '';
              }
              rg.iconImg = rg.iconImg ? rg.iconImg : rg.icon;
              if (!rg.name || !rg.iconImg || /click_event.*svg$/.test(rg.iconImg)) {
                let eventObj = eventSource.find(eb => eb.action == rg.action);
                if (eventObj) {
                  rg.name || (rg.name = eventObj.name);
                  if (!rg.iconImg || /click_event.*svg$/.test(rg.iconImg)) {
                    rg.local_icon = eventObj.local_icon;
                  }
                }
              }
              return rg;
            } else if (item.recommend_type == 0) {
              if (rg.article_type == 3 && rg.form_data.event.action) {
                let oldEventParams = rg.form_data.event,
                  newEventParams = {};
                Object.keys(oldEventParams).forEach(k => {
                  if (/\-/.test(k)) {
                    newEventParams[k.replace(/\-/g, '_')] = oldEventParams[k];
                  } else {
                    newEventParams[k] = oldEventParams[k];
                  }
                });
                rg.event_params = newEventParams;
              } else {
                rg.event_params = '';
              }
              if (rg.form_data && rg.form_data.recommend) {
                delete rg.form_data.recommend;
              }
              return rg;
            }
            return rg;
          });
        })
        this.setData({
          storeStyle: res.color_config,
          recommendInfo: res.recommend_config || []
        });
      }, this.properties.franchiseeId);
    },
    onShareAppMessage: function (e) {
      let shareTitle = e.currentTarget.dataset.eventparams.desc || '';
      let router = app.getHomepageRouter();
      let sharePath = '/pages/' + router + '/' + router;
      let imageUrl = e.currentTarget.dataset.eventparams.shareImage
      return {
        path: sharePath,
        title: shareTitle,
        imageUrl: imageUrl   
        }
    },
    gotoCouponDetail: function (event) {
      let id = event.currentTarget.dataset.couponId;
      let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
      app.turnToPage('/pages/couponDetail/couponDetail?couponStatus=recieve&detail=' + id + franchiseeParam);
    },
    turnToArticle: function (event) {
      if (event.currentTarget.dataset.articleType == 3) {
        this.bindEventTapHandler(event);
        return;
      }
      let id = event.currentTarget.dataset.id;
      let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
      app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + id + franchiseeParam);
    },
    turnToGoodsDetail: function (event) {
      let id = event.currentTarget.dataset.id,
        style = event.currentTarget.dataset.style;
      let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
      if (style == 3) {
        app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + franchiseeParam);
      } else {
        app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + id + franchiseeParam);
      }
    },
    bindEventTapHandler: function (e) {
      let form = e.currentTarget.dataset.eventParams;
      let action = form.action;
      customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action](form);
    }
  }
})
