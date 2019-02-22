const util = require('../../../utils/util.js');

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userCenterInfo: {
      nickname: '',
      coverThumb: '',
      phone: ''
    },
    toastInfo: {
      isShow: false,
      tipTxt: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.getUserCenterInfo();
  },

  /**
   * 获取用户信息
   */
  getUserCenterInfo: function () {
    let that = this;
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/PersonalCenter',
      hideLoading: true,
      success: function (res) {
        let returnData = res.data;
        let tempObj = {};
        // 用户昵称
        tempObj.nickname = returnData.nickname || userInfo.nickname;
        // 用户头像
        tempObj.coverThumb = returnData.headimgurl || userInfo.cover_thumb || app.globalData.appLogo;
        // 用户手机号码
        tempObj.phone = returnData.phone || userInfo.phone || '';
        that.setData({
          userCenterInfo: tempObj
        })
      }
    });
  },
  
  /**
   * 昵称输入
   */
  userInfoInputHandler: function (e) {
    let type = e.currentTarget.dataset.type;
    // 输入的内容
    let inputVal = e.detail.value;

    let tempObj = {};
    if (type === 'nickname') { // 昵称
      tempObj = {
        'userCenterInfo.nickname': inputVal
      }
    } else if (type === 'phone') { // 手机号码
      tempObj = {
        'userCenterInfo.phone': inputVal
      };
    }
    this.setData(tempObj);

  },

  /**
   * 选择头像
   */
  chooseCoverThumb: function () {
    let that = this;
    app.chooseImage(function(imgsUrl){
      that.setData({
        'userCenterInfo.coverThumb': imgsUrl[0]
      });
    });
  },

  /**
   * 保存用户信息
   */
  saveUserInfo: function () {
    let that =  this,
      dataObj = this.data;

    let nickname = dataObj.userCenterInfo.nickname,
      coverThumb = dataObj.userCenterInfo.coverThumb,
      phone = dataObj.userCenterInfo.phone || '';
    
    if (nickname.trim() === '' || nickname === null) {
      this.showToast('昵称不能为空');
      return false;
    }
    if (phone) {
      // 校验手机号码格式
      let isPhone = util.isPhoneNumber(phone);
      if (!isPhone) {
        this.showToast('手机号码格式不正确');
        return false;
      }
    }

    let param = {
      from_data: {
        'phone': phone,
        'nickname': nickname,
        'headimgurl': coverThumb
      }
    };

    app.sendRequest({
      url: '/index.php?r=CrossPlatform/SetPersonalInfo',
      data: param,
      method: 'post',
      success: function (res) {
        that.showToast('保存成功');
        setTimeout(() => {
          app.turnBack();
        }, 1000);
      }
    });
  },
  /**
   * 显示toast
   */
  showToast: function (title, duration = 1500) {
    this.setData({
      'toastInfo.isShow': true,
      'toastInfo.tipTxt': title
    });
    setTimeout(() => {
      this.setData({
        'toastInfo.isShow': false,
        'toastInfo.tipTxt': '',
      });
    }, duration);
  },
})