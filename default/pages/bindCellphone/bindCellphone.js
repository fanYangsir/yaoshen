var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {
    hideVerifyPhone: true,
    hideBindNewPhone: true,
    appLogo: '',
    appTitleLen: 0,
    appTitle: '',
    isQuick: true,
    oldCode: '',
    oldCodeBtnDisabled: false,
    oldCodeStatus: '获取验证码',
    nextStepDisabled: false,
    newPhone: '',
    nationCode: '86',
    intlCode: '',
    newCode: '',
    newCodeBtnDisabled: false,
    newCodeStatus: '获取验证码',
    bindNewPhoneBtnDisabled: false,
    codeInterval: 60,
    array: ['中国', '美国', '加拿大'],
    oldPhonePicCodeUrl: '',
    newPhonePicCodeUrl: '',
    hasMerged: false,
    accountList: [],
    isPageBottom: false,
    isMember: 0
  },
  oldPhonePicCode: '',
  newPhonePicCode: '',
  formerPageRouter: '',
  formerOtherRouter: '',
  onLoad: function (options) {
    var userInfo = app.getUserInfo();
    if (options.p) {
      this.formerOtherRouter = decodeURIComponent(options.p)
    }
    if (options.is_member == 1){
      this.setData({
        isMember: 1
      })
    }
    this.formerPageRouter = options.r || '';
    if (userInfo.phone) {
      this.setData({
        hideVerifyPhone: false
      })
      this.refreshOldPhonePicCode();
      this.getAccountInfo();
    } else {
      this.setData({
        hideBindNewPhone: false
      })
      this.refreshNewPhonePicCode();
    };

    let tabPage = app.getTabPagePathArr();
    let pageUrl = '/pages/' + this.formerPageRouter + '/' + this.formerPageRouter;
    if (tabPage.indexOf(pageUrl) > -1) {
      this.setData({
        'showBackHomeButton': true
      });
    }
    this.dataInitial();
  },
  dataInitial: function () {
    this.pageDataInitial();
    this.getXcxUserInfo();
  },
  pageDataInitial: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppData/GetAppLayoutConfig',
      data: {
        his_id: app.globalData.historyDataId,
        page: 'userCenterComponentPage'
      },
      success: function (res) {
        if (res.status == 0) {
          var data = res.data;
          that.setData({
            appLogo: data.app_logo,
            appTitle: data.app_name,
            appTitleLen: data.app_name.length
          });
        }
      }
    })
  },
  getXcxUserInfo: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppData/GetXcxUserInfo',
      data: {},
      success: function (res) {
        that.setData({
          hasMerged: res.data.has_merged == 0
        });
      }
    })
  },
  changeType(e) {
    var self = this,
      isQuick = true,
      data = e.currentTarget.dataset;
    if (data.type == 'quick') {
      isQuick = true;
    } else {
      isQuick = false;
    }
    self.setData({
      isQuick: isQuick
    })
  },
  getAccountInfo: function (callback) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAccountIfCouldMerge',
      data: {},
      success: function (res) {
        that.setData({
          accountList: res.data.list || []
        });

        typeof callback === 'function' && callback(res);
      }
    })
  },
  sendCodeToOldPhone: function () {
    var that = this;
    if (this.data.oldCodeBtnDisabled) {
      return;
    }
    if (!this.oldPhonePicCode) {
      app.showModal({
        content: '请输入图形验证码'
      });
      return;
    }

    this.setData({
      oldCodeStatus: '正在发送...',
      oldCodeBtnDisabled: true
    })
    app.sendRequest({
      url: '/index.php?r=AppData/PhoneCode',
      data: {
        pic_code: this.oldPhonePicCode
      },
      success: function () {
        var second = that.data.codeInterval,
          interval;

        interval = setInterval(function () {
          if (second < 0) {
            clearInterval(interval);
            that.setData({
              oldCodeStatus: '获取验证码',
              oldCodeBtnDisabled: false
            })
          } else {
            that.setData({
              oldCodeStatus: second + 's',
            })
            second--;
          }
        }, 1000);
      },
      complete: function () {
        that.setData({
          oldCodeStatus: '获取验证码',
          oldCodeBtnDisabled: false
        })
      }
    })

  },
  inputOldCode: function (e) {
    this.setData({
      oldCode: e.detail.value
    })
  },
  nextStep: function () {
    var that = this;
    if (!this.data.oldCode) {
      app.showModal({
        content: '请输入验证码'
      })
      return;
    }
    if (this.data.nextStepDisabled) {
      return;
    }

    this.setData({
      nextStepDisabled: true
    })
    app.sendRequest({
      url: '/index.php?r=AppData/VerifyPhone',
      method: 'post',
      data: {
        code: this.data.oldCode
      },
      success: function () {
        that.setData({
          hideVerifyPhone: true,
          hideBindNewPhone: false
        })
        that.refreshNewPhonePicCode();
      },
      complete: function () {
        that.setData({
          nextStepDisabled: false
        })
      }
    })
  },
  inputPhone: function (e) {
    this.setData({
      newPhone: e.detail.value
    })
  },

  inputNewCode: function (e) {
    this.setData({
      newCode: e.detail.value
    })
  },
  sendCodeToNewPhone: function () {
    var that = this,
      newPhone = this.data.newPhone,
      phone = this.data.nationCode != '86' ? this.data.nationCode + '-' + newPhone : newPhone,
      isPhoneNumber = /^1\d{10}$/.test(phone) || /^\+?\d+-\d+$/.test(phone);

    app.getStorage({
      key: 'session_key',
      success: function (res) {
        if (res.data == '') {
          app.showModal({
            content: '未获取授权，验证码获取失败'
          })
          return;
        };
      }
    })

    if (!this.newPhonePicCode) {
      app.showModal({
        content: '请输入图形验证码'
      });
      return;
    }
    if (!isPhoneNumber) {
      app.showModal({
        content: '请输入正确的手机号码'
      })
      return;
    }
    if (this.data.newCodeBtnDisabled) {
      return;
    }

    this.setData({
      newCodeStatus: '正在发送...',
      newCodeBtnDisabled: true
    })
    app.sendRequest({
      url: '/index.php?r=AppData/NewPhoneCode',
      method: 'post',
      data: {
        phone: phone,
        pic_code: this.newPhonePicCode
      },
      success: function (res) {
        var second = that.data.codeInterval,
          interval;

        interval = setInterval(function () {
          if (second < 0) {
            clearInterval(interval);
            that.setData({
              newCodeStatus: '获取验证码',
              newCodeBtnDisabled: false
            })
          } else {
            that.setData({
              newCodeStatus: second + 's',
            })
            second--;
          }
        }, 1000);
      },
      complete: function () {
        that.setData({
          newCodeStatus: '获取验证码',
          newCodeBtnDisabled: false
        })
      }
    })
  },
  bindNewPhone: function () {
    var that = this,
      newPhone = this.data.newPhone,
      newCode = this.data.newCode,
      nationCode = this.data.nationCode != '86' ? this.data.nationCode : '',
      intlCode = this.data.intlCode,
      phone = nationCode ? nationCode + '-' + newPhone : newPhone,
      isPhoneNumber = /^1\d{10}$/.test(phone) || /^\+?\d+-\d+$/.test(phone);
    if (!newPhone || !newCode) {
      return;
    }
    if (!isPhoneNumber) {
      app.showModal({
        content: '请输入正确的手机号码'
      })
      return;
    }

    if (this.data.bindNewPhoneBtnDisabled) {
      return;
    }
    this.setData({
      bindNewPhoneBtnDisabled: true
    })

    app.sendRequest({
      url: '/index.php?r=AppData/XcxVerifyNewPhone',
      mehtod: 'post',
      data: {
        phone: phone,
        code: newCode,
        nationCode: nationCode,
        intlCode: intlCode
      },
      success: function (res) {
        app.setUserInfoStorage({
          phone: newPhone
        });
        app.showToast({
          title: '绑定成功',
          icon: 'success',
          success: function () {
            that.getAccountInfo(function () {
              if (that.data.hasMerged && that.data.accountList.length > 0) {
                app.turnToPage('/default/pages/userCollect/userCollect', 1);
              } else if (that.formerOtherRouter) {
                app.turnToPage('/' + that.formerOtherRouter + '&from=bindCellphone', true)
              } else if (that.data.isMember === 1){
                app.turnToPage('/pages/' + that.formerPageRouter + '/' + that.formerPageRouter + '?is_member=1', 1);
              } else {
                app.turnToPage('/pages/' + that.formerPageRouter + '/' + that.formerPageRouter, 1);
              }
            })
          }
        })
      },
      fail: function (res) {
        app.showModal({
          content: '绑定失败' + res.data
        })
      },
      complete: function () {
        that.setData({
          bindNewPhoneBtnDisabled: false
        })
      }
    })
  },
  getPhoneNumber: function (e) {
    let that = this;
    if (e.detail.errMsg == "getPhoneNumber:fail user deny" || e.detail.errMsg == "getPhoneNumber:fail:user denied" || e.detail.errMsg == "getPhoneNumber:fail:cancel to confirm login") {
      console.log(e.detail.errMsg);
      app.addLog(e.detail);
    }else if(e.detail.errMsg == "getPhoneNumber:fail 该 appid 没有权限" || e.detail.errMsg == "getPhoneNumber:fail jsapi has no permission, event…sg=permission got, detail=jsapi has no permission"){
      app.showModal({
        content: '该appid没有权限，目前该功能针对非个人开发者，且完成了认证的小程序开放（不包含海外主体）'
      });
      app.addLog(e.detail);
    }else if(e.detail.encryptedData){
      app.checkSession(function () {
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppUser/GetPhoneNumber',
          data: {
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv
          },
          success: function (res) {
            app.setUserInfoStorage({
              phone: res.data
            })
            app.showToast({
              title: '授权成功',
              icon: 'success',
              success: function () {
                that.getAccountInfo(function () {
                  if (that.data.hasMerged && that.data.accountList.length > 0) {
                    app.turnToPage('/default/pages/userCollect/userCollect', 1);
                  } else if (that.formerOtherRouter) {
                    app.turnToPage('/' + that.formerOtherRouter + '&from=bindCellphone', true)
                  } else if(that.data.isMember){
                    app.turnToPage('/pages/' + that.formerPageRouter + '/' + that.formerPageRouter + '?is_member=1', 1);
                  }else {
                    app.turnToPage('/pages/' + that.formerPageRouter + '/' + that.formerPageRouter, 1);
                  }
                })
              }
            })
          },
          successStatus5: function(){
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
    }else{
      app.showModal({
        content: '无法获取到手机号，请检查该appid是否有权限'
      });
      app.addLog(e);
    }

  },
  inputOldPhonePicCode: function (e) {
    var value = e.detail.value;
    this.oldPhonePicCode = value;
  },
  inputNewPhonePicCode: function (e) {
    var value = e.detail.value;
    this.newPhonePicCode = value;

  },
  refreshOldPhonePicCode: function () {
    this.setData({
      oldPhonePicCodeUrl: app.getSiteBaseUrl() + '/index.php?r=Login/GetIdentifyCode&i=' + parseInt(Math.random() * 10000000) + '&session_key=' + app.getSessionKey()
    });
  },
  refreshNewPhonePicCode: function () {

    this.setData({
      newPhonePicCodeUrl: app.getSiteBaseUrl() + '/index.php?r=Login/GetIdentifyCode&i=' + parseInt(Math.random() * 10000000) + '&session_key=' + app.getSessionKey()
    });
  },

  backToHomePage: function () {
    app.turnToPage('/pages/' + app.globalData.homepageRouter + '/' + app.globalData.homepageRouter)
  },
  bindPickerChange: function (e) {
    var value = e.detail.value,
      nationCode = value == '0' ? '86' : '1',
      intlCode = value == '0' ? '' : (value == '1' ? 'US' : 'CA');
    this.setData({
      nationCode: nationCode,
      intlCode: intlCode
    })
  }
})