var app = '';
var tapPluginLinkLoading = false;

setTimeout(function(){
  app = getApp();
}, 100);

var clickEventHandler = {
  "goods-trade": function(param, franchisee) {
    let gtype = param['goods-type'] || param['goods_type'];
    let id = param['goods-id'] || param['goods_id'];
    if(!id){
      return;
    }
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';

    if (gtype == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + queryStr + chainParam);
    } if (gtype == 10) {
      app.turnToPage('/newAppointment/pages/newAppointmentDetail/newAppointmentDetail?detail=' + id + queryStr + chainParam);
    } else {
      app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + id + queryStr + chainParam);
    }
  },
  "to-seckill": function (param, franchisee) {
    let id = param['seckill-id'] || param['seckill_id'];
    if (!id) {
      return;
    }
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/pages/goodsDetail/goodsDetail?goodsType=seckill&detail=' + id + queryStr + chainParam);
  },
  "inner-link": function (param, franchisee) {
    let pageRoot = {
      'groupCenter': '/eCommerce/pages/groupCenter/groupCenter',
      'shoppingCart': '/eCommerce/pages/shoppingCart/shoppingCart',
      'myOrder': '/eCommerce/pages/myOrder/myOrder',
      'myMessage': '/userCenter/pages/myMessage/myMessage',
    };
    let pageLink = param['inner-page-link'] || param['page-link'] || param['inner_page_link'];
    let url = pageRoot[pageLink] ? pageRoot[pageLink] : '/pages/' + pageLink + '/' + pageLink;
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';

    if (url.indexOf('/prePage/') >= 0) {
      app.turnBack();
    } else{
      let is_redirect = param.is_redirect == 1 ? true : false;
      let pageRouter = app.getAppCurrentPage().page_router;

      if (pageRouter == app.globalData.homepageRouter || app.getTabPagePathArr().indexOf(url) !== -1) {
        is_redirect = false;
      }
      app.turnToPage(url + queryStr, is_redirect);
    }
  },
  "group-buy": function(param,franchisee){
    let goods_id = param['goods-id'];
    let activity_id = param['active-id']; 
    app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id='+  goods_id + '&activity_id=' + activity_id);
  },
  "call": function (param, franchisee, event) {
    if (param && param.phoneNumberSource === 'dynamic') {
      let dataset = event.currentTarget.dataset;
      let phone_num = dataset.realValue ? dataset.realValue[0].text : '';
      if (phone_num === '') {
        return;
      }
      app.makePhoneCall(phone_num);
      return;
    }
    let phone_num = param['phone-num'] || param['phone_num'];
    app.makePhoneCall(phone_num);
  },
  "get-coupon": function (param, franchisee) {
    let coupon_id = param['coupon-id'] || param['coupon_id'];
    if(!coupon_id){
      return;
    }
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/pages/couponDetail/couponDetail?detail=' + coupon_id + queryStr + chainParam);
  },
  "community": function (param, franchisee) {
    let community_id = param['community-id'] || param['community_id'];
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/informationManagement/pages/communityPage/communityPage?detail=' + community_id + queryStr + chainParam)
  },
  "franchisee-enter": function(param, franchisee){
    app.turnToPage('/franchisee/pages/franchiseeEnter/franchiseeEnter');
  },
  "franchisee-cooperation" : function(param, franchisee) {
    app.turnToPage('/franchisee/pages/franchiseeCooperation/franchiseeCooperation');
  },
  "to-franchisee": function (param, franchisee) {
    let franchisee_id = param['franchisee-id'] || param['franchisee_id'];
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByAppId',
      data: {
        parent_app_id: app.getAppId(),
        sub_app_id: franchisee_id
      },
      success: function (res) {
        let data = res.data;
        if (data) {
          let mode = data.mode_id;
          let shop = '';
          let param = {};

          param.detail = franchisee_id;
          if (data.audit == 2) {
            param.shop_id = data.id;
          }
          app.goToFranchisee(mode, param);
        }
      }
    })
  },
  "to-promotion": function (param, franchisee) {
    app._isOpenPromotion();
  },
  "coupon-receive-list": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/couponReceiveListPage/couponReceiveListPage');
  },
  "recharge": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/recharge/recharge');
  },
  "lucky-wheel": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/awardManagement/pages/luckyWheelDetail/luckyWheelDetail' + queryStr + chainParam);
  },
  "golden-eggs": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/awardManagement/pages/goldenEggs/goldenEggs' + queryStr + chainParam);
  },
  "scratch-card": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/awardManagement/pages/scratch/scratch' + queryStr + chainParam);
  },
  "video": function (param, franchisee) {
    let video_id = param['video-id'];
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + video_id + chainParam);
  },
  "video-detail": function (param, franchisee) {
    let video_id = param['video_id'] || param['video-id'];
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + video_id + chainParam);
  },
  "video-play": function (param, franchisee) {
    let pageInstance = app.getAppCurrentPage(),
        compid = param.compid,
        video_id = param['video-id'];
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoLibURL',
      method: 'get',
      data: { id: video_id },
      success: function (res) {
        let newdata = {}
        newdata[compid + '.videoUrl'] = res.data;
        pageInstance.setData(newdata);
      }
    })
  },
  "transfer": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/eCommerce/pages/transferPage/transferPage' + queryStr + chainParam);
  },
  "turn-to-xcx": function (param, franchisee) {
    app.navigateToXcx({
      appId: param['xcx-appid'] || param['xcx_appid'],
      path: param['xcx-page-url'] || param['xcx_page_url'] || ''
    });
  },
  "wifi": function (param, franchisee) {
    let system = app.getSystemInfoData().system;

    app.startWifi({
      success: function (res) {
        if (/ios/i.test(system)) {
          wx.showLoading({
            title: '连接中'
          })
        }
        console.log('wifi connectWifi');
        app.connectWifi({
          SSID: param.wifi['wifi-name'],
          BSSID: param.wifi['wifi-address'],
          password: param.wifi['wifi-password'],
          success: function (res) {
            setTimeout(function () {
              app.showToast({
                title: '连接成功',
                icon: 'success',
                duration: 3000
              });
            }, 1000)
          },
          fail: function (res) {
            console.log(res);
            app.addLog(res);
            if (res.errCode) {
              app.showModal({
                content: app.wifiErrCode(res.errCode)
              })
            } else if (res.errMsg == 'connectWifi:fail the api is only supported in iOS 11 or above') {
              app.showModal({
                content: '连接WiFi功能，仅Android 与 iOS 11 以上版本支持'
              })
            } else if (/connectWifi:fail/.test(res.errMsg)) {
              app.showModal({
                content: res.errMsg
              })
            }
          },
          complete: function (res) {
            wx.hideLoading();
          }
        })
      },
      fail: function (res) {
        app.showModal({
          content: res.errMsg
        })
      }
    })
  },
  "plugin-link": function (param, franchisee) {
    if (tapPluginLinkLoading) {
      return;
    }
    tapPluginLinkLoading = true;
    app.sendRequest({
      url: '/index.php?r=pc/OpenPlugin/GetPluginInfo',
      data: {
        'plugin_name': param['plugin-name']
      },
      success: function (res) {
        let page = res.data.plugin_home_page;
        let tabBarPagePathArr = app.getTabPagePathArr();
        let curl = `/pages/tabbarPlugin${res.data.plugin_name}/tabbarPlugin${res.data.plugin_name}`;
        if (tabBarPagePathArr.indexOf(curl) != -1) {
          app.switchToTab(curl);
          return;
        }
        app.turnToPage('/' + res.data.package_root + '/' + res.data.plugin_name + '/pages/' + page + '/' + page);
      },
      complete: function () {
        tapPluginLinkLoading = false;
      }
    });
  },
  "topic": function (param, franchisee) {
    let topic_id = param['topic-id'];
    if (!topic_id) {
      return;
    }
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + topic_id + queryStr + chainParam);
  },
  "news": function (param, franchisee) {
    let news_id = param['news-id'];
    if (!news_id) {
      return;
    }
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '&franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + news_id + queryStr + chainParam);
  },
  "page-share": function (param, franchisee) {
    let pageInstance = app.getAppCurrentPage();
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    let queryStr = '';
    for (let i in pageInstance.sharePageParams) {
      queryStr += '&' + i + '=' + pageInstance.sharePageParams[i]
    }
    let router = pageInstance.route.split('/')[2];
    let objId = router == 'newsDetail' ? pageInstance.options.detail : router;
    let shareType = router == 'newsDetail' ? 17 : 11;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: {
        obj_id: objId,
        type: shareType,
        text: param.pageShareCustomText,
        goods_img: param.pageShareImgUrl,
        params: queryStr,
        p_id: app.globalData.p_id
      },
      success: function (res) {
        animation.bottom("0").step();
        pageInstance.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  "wx-coupon": function (param, franchisee) {
    let wxcouponId = param['wxcoupon-id'] || param['wxcoupon_id'];
    app.sendRequest({
      url: '/index.php?r=appWeChatCoupon/getSignature',
      data: {
        card_id: wxcouponId
      },
      success: function (res) {
        wx.addCard({
          cardList: [
            {
              cardId: wxcouponId,
              cardExt: '{"nonce_str":"' + res.data.timestamp + '","timestamp":"' + res.data.timestamp + '", "signature":"' + res.data.signature + '"}'
            }
          ],
          success: function (res) {
            app.sendRequest({
              url: '/index.php?r=appWeChatCoupon/recvCoupon',
              data: {
                code: res.cardList[0].code,
                card_id: res.cardList[0].cardId
              },
              success: function (res) {
                app.showModal({
                  content: '领取卡券成功'
                })
              }
            });
          }
        })
      }
    });
  },
  "vip-card-list": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/vipCard/vipCard');
  },
  "goods-foot-print": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/goodsFootPrint/goodsFootPrint');
  },
  "goods-favorites": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/goodsFavorites/goodsFavorites');
  },
  "vip-interests":  function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    let chainParam = (!franchisee && app.globalData.chainAppId) ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/eCommerce/pages/vipBenefits/vipBenefits' + queryStr + chainParam);
  },
  "goods-scan-code": function(){
    let path = '/eCommerce/pages/shoppingCart/shoppingCart?goodsScanCode=true';
    app.getAppECStoreConfig((res) => {
      if (res.cart_config.shopping_by_scanning_code == 1) {
        app.turnToPage(path);
      } else {
        app.showModal({
          content: '暂未开通扫码购'
        })
      }
    })
  },
  "preview-picture": function (param, franchisee, event){
    let dataset = event.currentTarget.dataset;
    let urls = dataset.imgarr instanceof Array ? dataset.imgarr : [dataset.imgarr];
    app.previewImage({
      current: dataset.img || urls[0],
      urls: urls,
    });
  },
  "popup-window-control": function (param){
    let pageInstance = app.getAppCurrentPage();
    let windowControl = param.windowControl;
    let newData = {};
    let windowCompId, windowCustomFeature;

    for (let windowConfig of pageInstance.popupWindowComps) {
      if (windowConfig.id === windowControl.popupWindowId) {
        windowCompId = windowConfig.compid;
        windowCustomFeature = pageInstance.data[windowCompId].customFeature;
      }
    }
    if (windowControl.action === 'show') {
      newData[windowCompId + '.showPopupWindow'] = true;
    } else if (windowControl.action === 'hide') {
      newData[windowCompId + '.showPopupWindow'] = false;
    }
    pageInstance.setData(newData);

    if (windowCustomFeature && windowCustomFeature.autoClose === true) {
      setTimeout(() => {
        newData[windowCompId + '.showPopupWindow'] = false;
        pageInstance.setData(newData);
      }, +windowCustomFeature.closeDelay * 1000);
    }
  },
  "sidebar-control": function (param){
    let pageInstance = app.getAppCurrentPage();
    let sidebarControl = param.sidebarControl;
    let newData = {};
    let sidebarCompId;

    for (let sidebarConfig of pageInstance.sidebarComps) {
      let sidebarCustomFeature = pageInstance.data[sidebarConfig.compid].customFeature
      if (sidebarCustomFeature.id === sidebarControl.sidebarId) {
        sidebarCompId = sidebarConfig.compid;
      }
    }
    if (sidebarControl.action === 'show') {
      newData[sidebarCompId + '.showSidebar'] = true;
    } else if (sidebarControl.action === 'hide') {
      newData[sidebarCompId + '.hideSidebar'] = true;
    }
    pageInstance.setData(newData);
  },
  "refresh-list": function (param, franchisee){
    app.tapRefreshListHandler(null, {
      refresh_object: param.refresh_object,
      index_segment: param.index_segment,
      index_value: param.index_value
    });
  },
  "search": function (param, franchisee, event) {
    let pageInstance = app.getAppCurrentPage();
    let listId = param.search.listId;
    let data = pageInstance.data;
    let searchCompid = '';
    for (let i in data) {
      if (data[i].customFeature && listId == data[i].customFeature.id) {
        searchCompid = data[i].compId;
        break;
      }
    }
    if (searchCompid) {
      let searchCompData = pageInstance.data[searchCompid];
      if (searchCompData.type == 'goods-list') {
        app.turnToPage('/pages/classifyGoodsListPage/classifyGoodsListPage?form=' + searchCompData.customFeature.form );
      }else{
        app.showModal({
          content: '搜索的点击事件只能关联电商、到店、预约列表'
        })
        return;
        // let searchObject = {
        //   customFeature: searchCompData.customFeature,
        //   type: searchCompData.type
        // };
        // let newdata = {};
        // let compid = event.currentTarget.dataset.compid;
        // newdata[compid + '.customFeature.searchObject'] = searchObject;
        // pageInstance.setData(newdata);
        // pageInstance.keywordList[compid] = param.search.placeholder;
        // app.searchList(event);
      }
    } else {
      app.showModal({
        content: '找不到搜索关联的列表'
      })
    }
  },
  "top": function (param){
    app.pageScrollTo(0);
  },
  "click-event": function (param, franchisee) {
    let lookLink = param && param['look-link'];
    let queryStr = '';
    if (lookLink.indexOf("?") != -1) {
      queryStr = franchisee ? '&franchisee=' + franchisee : '';
    } else {
      queryStr = franchisee ? '?franchisee=' + franchisee : '';
    }
    app.turnToPage(lookLink + queryStr);
  },
  "wx-vip-card": function (param){
    let cardId = param['card-id'];
    let id = param['wx-vip-card-id'];
    if (cardId){
      app.sendRequest({
        url: '/index.php?r=appWeChatCoupon/getSignature',
        data: {
          card_id: cardId
        },
        success: function (res) {
          wx.addCard({
            cardList: [
              {
                cardId: cardId,
                cardExt: '{"nonce_str":"' + res.data.timestamp + '","timestamp":"' + res.data.timestamp + '", "signature":"' + res.data.signature + '"}'
              }
            ],
            success: function (res) {
              console.log(res);
              app.showModal({
                content: '领取成功'
              });
            }
          })
        }
      });
    }
  },
  "differential-mall": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/differentialMall/pages/dMWebView/dMWebView' + queryStr);
  },
}


module.exports = {
  clickEventHandler: clickEventHandler
}
