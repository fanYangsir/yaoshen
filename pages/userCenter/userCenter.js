var app = getApp()

Page({
  data: {
    userInfo: {},                      // 用户信息
    todayDate: '2018-8-10',            // 今天的日期
    userCityArr: ['', '', ''],         // 用户城市信息的集合   [country, pri, city]
    isGetPhoneNumber: false,           // 是否获得手机授权
    isFromBack: false,
    collectConfig: {},                 // 收集配置
    cardId: '',                        // 需要领取的会员卡id
    isNoConditionRecv: '',             // 是否无门槛领卡
    franchisee: '',                    // 子店id
    backRouter: '',                    // 设置返回的路由
    isCantChangeBir: false,            // 生日是否可改
  },
  onLoad: function (options) {
    let cardId = options.id || '';     // 存在cardId即为会员信息保存，否则为个人信息（不校验必填项）
    let isMember = options.is_member || '';
    let isNoConditionRecv = options.is_no_condition_recv || '';
    let r = options.r || '';
    let franchisee = options.franchisee || '';

    this.setData({
      cardId: cardId || isMember,
      isNoConditionRecv: isNoConditionRecv,
      backRouter: r,
      franchisee: franchisee
    })

    if (this.data.cardId) {
      wx.setNavigationBarTitle({
        title: '会员信息'
      })
    }

    this.getCollectUserinfoConfig();
    this.infoInit();
    this.getXcxUserInfo();
  },
  onShow: function () {
    if (this.data.isFromBack) {
      this.getXcxUserInfo();
    } else {
      this.setData({
        isFromBack: true
      });
    }
  },
  getCollectUserinfoConfig: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getCollectUserinfoConfig',
      method: 'post',
      data: {
      },
      hideLoading: false,
      success: function (res) {
        _this.setData({
          collectConfig: res.data
        })
      }
    })
  },
  getXcxUserInfo: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppData/getXcxUserInfo',
      success: res => {
        if (res.status == 0) {
          var data = res.data;
          that.setData({
            'userInfo.phone': data.phone || '',
          })
        }
      }
    })
  },
  infoInit: function () {
    let date = new Date();
    let userInfo = app.getUserInfo();
    let userCityArr = ['', '', ''];

    if(userInfo.birthday === '0000-00-00'){
      userInfo.birthday = '';
    }
    if (userInfo.province && userInfo.city) {
      userCityArr = [userInfo.province, userInfo.city, '']
    }
    this.setData({
      userInfo: userInfo,
      isCantChangeBir: userInfo.birthday && userInfo.birthday != '0000-00-00',
      userCityArr: userCityArr,
      isGetPhoneNumber: userInfo.phone ? true : false,
      todayDate: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
    });
  },
  choosePhoto: function () {
    var that = this;
    app.chooseImage(function (imgUrl) {
      that.setData({
        'userInfo.cover_thumb': imgUrl[0]
      })
    });
  },
  selectedSex: function(e){
    this.setData({
      'userInfo.sex': e.detail.value
    })
  },
  bindBirthdayChange: function (e) {
    this.setData({
      'userInfo.birthday': e.detail.value
    })
  },
  bindCityChange: function (e) {
    this.setData({
      'userCityArr': e.detail.value
    })
  },
  inputUserInfo: function (e) {
    let setData = {}

    if (e.currentTarget.dataset.type === 'nickname') {
      setData = { 'userInfo.nickname': e.detail.value }
    } else if (e.currentTarget.dataset.type === 'weixinCode') {
      setData = { 'userInfo.weixin_code': e.detail.value }
    } else if (e.currentTarget.dataset.type === 'email') {
      if (this.checkEmail(e.detail.value)) {
        setData = { 'userInfo.email': e.detail.value }
      } else {
        return;
      }
    } else if (e.currentTarget.dataset.type === 'company') {
      setData = { 'userInfo.company': e.detail.value }
    }

    this.setData(setData);
  },
  getPhoneNumber: function (e) {
    if (this.data.isGetPhoneNumber) {
      return;
    }

    let _this = this;
    app.checkSession(function () {
      if (!e.detail.encryptedData) {
        return;
      }
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppUser/GetPhoneNumber',
        data: {
          encryptedData: e.detail.encryptedData || '',
          iv: e.detail.iv || ''
        },
        success: function (res) {
          app.setUserInfoStorage({
            phone: res.data
          })

          _this.setData({
            'userInfo.phone': res.data,
            isGetPhoneNumber: true
          })
        },
        successStatus5: function () {
          app.goLogin({
            success: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            },
            fail: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            }
          });
        }
      })
    });
  },
  bindCellphonePage: function () {
    let page_router = app.getAppCurrentPage().route.split('/').pop();

    if (this.data.cardId) {
      app.turnToPage('/default/pages/bindCellphone/bindCellphone?r=' + page_router + '&is_member=1', 1);
    } else {
      app.turnToPage('/default/pages/bindCellphone/bindCellphone?r=' + page_router, 1);
    }
  },
  // 保存用户信息
  saveUserInfo: function (e) {
    let data = this.data.userInfo;
    let _this = this;
    let config = this.data.collectConfig;
    let params = {};
    let cardId = this.data.cardId;

    if(cardId && !this.validate()){
      return;
    }
    
    params.nickname = data.nickname;
    params.phone = data.phone;
    params.sex = data.sex;
    params.birthday = data.birthday;
    params.cover_thumb = data.cover_thumb;
    config.collect_company != 0 ? params.company = data.company : '';
    config.collect_email != 0 ? params.email = data.email : '';
    if(config.collect_region != 0){
      params.province = this.data.userCityArr[0];
      params.city = this.data.userCityArr[1];
    }
    config.collect_weixin_id != 0 ? params.weixin_code = data.weixin_code : '';
    cardId ? params.formId = e.detail.formId : '';

    app.sendRequest({
      url: '/index.php?r=AppData/saveUserInfo',
      method: 'post',
      data: params,
      success: function (res) {
        if (res.status === 0) {
          app.setUserInfoStorage(params);
          if (_this.data.isNoConditionRecv) {
            _this.recvVipCard();
            return;
          }
          _this.savedAction();
        }
      }
    });
  },
  // 校验
  validate: function(){
    let config = this.data.collectConfig;
    let data = this.data.userInfo;

    if(config.collect_phone == 2 && !data.phone){
      app.showModal({
        content: '请完善手机号'
      });
      return false;
    }
    if(config.collect_birthday == 2 && (!data.birthday || data.birthday === '0000-00-00')){
      app.showModal({
        content: '请完善生日'
      });
      return false;
    }
    if(config.collect_weixin_id == 2 && !data.weixin_code){
      app.showModal({
        content: '请完善微信号'
      });
      return false;
    }
    if(config.collect_email == 2 && !data.email){
      app.showModal({
        content: '请完善邮箱'
      });
      return false;
    }
    if(config.collect_company == 2 && !data.company){
      app.showModal({
        content: '请完善公司'
      });
      return false;
    }
    if(config.collect_region == 2 && !this.data.userCityArr[0] && !this.data.userCityArr[1]){
      app.showModal({
        content: '请完善地址'
      });
      return false;
    }

    return true;
  },
  // 保存信息后的操作
  savedAction: function () {
    app.showToast({
      title: this.data.cardId ? '领取成功' : '保存成功',
      icon: 'success'
    });
    setTimeout(() => {
      app.turnToPage(this.data.backRouter || '/pages/userCenterComponentPage/userCenterComponentPage');
    }, 1000)
  },
  checkEmail: function (email) {
    let str = /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/
    if (str.test(email)) {
      return true
    } else {
      app.showModal({
        content: '请填写正确的邮箱',
      })
    }
  },
  // 无门槛领卡
  recvVipCard: function () {
    let _this = this;

    app.sendRequest({
      data: {
        vipcard_id: _this.data.cardId,
        sub_shop_app_id: _this.data.franchisee
      },
      url: '/index.php?r=AppVipCard/RecvVipCard',
      hideLoading: true,
      success: (res) => {
        _this.savedAction();
      }
    })
  },
  times: 0,
  time: '',
  openDebug: function(){
    this.times++;
    if(this.times > 5){
      wx.setEnableDebug({
        enableDebug: true
      })
    }
    if(!this.time){
      this.time = setTimeout(()=>{
        this.time = '';
        this.times = 0;
      }, 1000);
    }
  }
})