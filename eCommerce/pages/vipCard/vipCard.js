
var app = getApp()

Page({
  data: {
    appId: '',
    // 是否领取会员卡
    receiveCard: -1, // 默认不知道是否有领取
    // 卡片信息
    cardDetail: {
      appName: '',
      logoUrl: '',
      duration: '',
      level: '',
      number: ''
    },
    // 会员权益
    vipRights: {
      freePostage: 0,
      discount: 0,
      giveCouponStr: '',
      integral: 0
    },
    vipNotice: {
      description: ''
    },
    // 个人积分
    vipPoints: {
      canUseIntegral: 0,
      totalIntegral: 0,
      consumeNum: 0,
    },
    // 联系我们
    vipContact: {
      appName: '',
      phone: '无'
    },
    // 活动打开的详情
    activeItem: '',
    // 所有信息
    vipInfo: {},
    isPaidVip: '0'
  },
  onLoad: function(options){
    let vipId = options.detail || '';
    let franchiseeId = options.franchisee || '';
    let isPaidVip = options.is_paid_vip || '';

    this.setData({
      vipId: vipId,
      franchiseeId: franchiseeId,
      isPaidVip: isPaidVip
    });

    if(vipId){
      this.getVipInfo();
    }else{
      this.getHeadquartersVipInfo();
    }
  },
  // 获取会员卡信息
  getVipInfo: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardInfo',
      data: {
        app_id: that.data.franchiseeId,
        vip_id: that.data.vipId,
        is_paid_vip: that.data.isPaidVip
      },
      success: function(res){
        let cardBackground  = ''
        let vip = res.data[0];
        if (parseInt(vip.background_type) == 0) {
          cardBackground = 'url(' + vip.background + ') 0% 0% / 100% 100%';
        } else {
          cardBackground = vip.background;
        }

        let giveCouponStr = '';
        for (let i = 0; i < vip.coupon_list.length; i++) {
          giveCouponStr = giveCouponStr + '免费赠送' + vip.coupon_list[i].num + '张' + vip.coupon_list[i].name + '的优惠券,';
        }
        let giveBirCouponStr = '';
        if(vip.birthday_coupon_list && vip.birthday_coupon_list.length){
          let birthday_coupon_list = vip.birthday_coupon_list;
          for (let i = 0; i < birthday_coupon_list.length; i++) {
            giveBirCouponStr = giveBirCouponStr + '免费赠送' + birthday_coupon_list[i].num + '张' + birthday_coupon_list[i].name + '的优惠券,';
          }
        }
        
        vip.description = vip.description ? vip.description.replace(/<br \/>/g, '\n') : vip.description;
        
        that.setData({
          'vipInfo' : vip,
          'receiveCard': 1,
          'cardDetail.appName': vip.app_name,
          'cardDetail.logoUrl': vip.logo,
          'cardDetail.duration': vip.expired_time,
          'cardDetail.level': vip.title,
          'cardDetail.cardBackground': cardBackground,
          'cardDetail.number': vip.user_vip_id || '',
          'cardDetail.isShowVipid': vip.is_show_vipid || '',
          'vipRights.discount': vip.discount,
          'vipRights.giveCouponStr': giveCouponStr,
          'vipRights.giveBirCouponStr': giveBirCouponStr,
          'vipRights.integral': vip.integral,
          'vipRights.balance': vip.balance,
          'vipRights.freePostage': vip.is_free_postage,
          'vipNotice.description': vip.description,
          'vipPoints.canUseIntegral': vip.can_use_integral,
          'vipPoints.totalIntegral': vip.total_integral,
          'vipPoints.consumeNum': vip.consume_num,
          'vipContact.appName': vip.app_name,
          'vipContact.phone': vip.phone
        });
      }
    });
  },
  // 获取总店会员卡
  getHeadquartersVipInfo: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPInfo',
      data: {
        'app_id': app.globalData.appId,
        'is_all': 1
      },
      success: function(res){
        let cardBackground  = ''
        if (parseInt(res.data.background_type) == 0) {
          cardBackground = 'url(' + res.data.background + ') 0% 0% / 100% 100%';
        } else {
          cardBackground = res.data.background;
        }
        let giveCouponStr = '';
        let giveBirCouponStr = '';
        if (res.data.is_vip != 0) {
          for (let i = 0; i < res.data.coupon_list.length; i++) {
            giveCouponStr = giveCouponStr + '免费赠送' + res.data.coupon_list[i].num + '张' + res.data.coupon_list[i].name + '的优惠券,';
          }
          if(res.data.birthday_coupon_list && res.data.birthday_coupon_list.length){
            for (let i = 0; i < res.data.birthday_coupon_list.length; i++) {
              giveBirCouponStr = giveBirCouponStr + '免费赠送' + res.data.birthday_coupon_list[i].num + '张' + res.data.birthday_coupon_list[i].name + '的优惠券,';
            }
          }
        }
        res.data.description = res.data.description ? res.data.description.replace(/<br \/>/g, '\n') : res.data.description;
        that.setData({
          'vipInfo' : res.data,
          'receiveCard': res.data.is_vip || 0,
          'cardDetail.appName': res.data.app_name,
          'cardDetail.logoUrl': res.data.logo,
          'cardDetail.duration': res.data.expire,
          'cardDetail.level': res.data.title,
          'cardDetail.cardBackground': cardBackground,
          'cardDetail.number': res.data.user_vip_id || '',
          'cardDetail.isShowVipid': res.data.is_show_vipid || '',
          'vipRights.discount': res.data.discount || '',
          'vipRights.giveCouponStr': giveCouponStr || '',
          'vipRights.giveBirCouponStr': giveBirCouponStr || '',
          'vipRights.integral': res.data.integral || '',
          'vipRights.balance': res.data.balance || '',
          'vipRights.freePostage': res.data.is_free_postage || '',
          'vipNotice.description': res.data.description || '',
          'vipPoints.canUseIntegral': res.data.can_use_integral || '',
          'vipPoints.totalIntegral': res.data.total_integral || '',
          'vipPoints.consumeNum': res.data.consume_num || '',
          'vipContact.appName': res.data.app_name || '',
          'vipContact.phone': res.data.phone || ''
        });
      }
    });
  },
  // 展示对应内容
  showItemContent: function(event){
    let that = this;
    let _item = event.currentTarget.dataset.item;
    if (that.data.activeItem == _item) {
      _item = '';
    }
    that.setData({
      'activeItem': _item
    });
  },
  // 领取会员卡
  getVIPCardForUser: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardForUser',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.franchiseeId
      },
      success: function (res) {
        app.showModal({
          content: '领取成功!'
        });
        that.setData({
          'vipInfo.is_owner': 1
        });
      },
      complete: function () {

      }
    });
  }
})
