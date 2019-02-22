const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    locationCity: {
      city: '定位中...',
      id: '',
      location: {
        lat: '',
        lng: ''
      }
    },
    hotCitys: [{
      id: 231,
      name: '广州'
    }, {
      id: 247,
      name: '东莞'
    }, {
      id: 233,
      name: '深圳'
    }, {
      id: 241,
      name: '惠州'
    }, {
      id: 236,
      name: '佛山'
    }, {
      id: 234,
      name: '珠海'
    }, {
      id: 248,
      name: '中山'
    }, {
      id: 3327,
      name: '上海'
    }, {
      id: 3326,
      name: '北京'
    }, {
      id: 121,
      name: '杭州'
    }, {
      id: 217,
      name: '长沙'
    }, {
      id: 203,
      name: '武汉'
    }],
    initialArr: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'],
    historyCitys: [],
    selectedInitial: '',
    isHideInitial: true,
    isHideSearchResult: true,
    searchCitys: [],
    citys: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取所有城市
    this.getAllCitys();
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 定位当前城市
    this.getCurrentLocation();
    // 获取最近访问城市
    this.getHistoryCitys();
  },
  /**
    * 获取当前位置
    */
  getCurrentLocation: function () {
    let that = this,
      globalDataObj = app.globalData;

    let location = globalDataObj.locationInfo,
      lat = location.latitude,
      lng = location.longitude,
      info = location.info;

    // 如果全局变量没有经纬度，重新获取
    if (lat === '' || lng === '' || info === '') {
      app.getLocation({
        success: function (res) {
          if (res.errMsg === 'getLocation:ok') {
            let latitude = res.latitude;
            let longitude = res.longitude;
            // 经纬度保存到全局变量
            globalDataObj.locationInfo.latitude = latitude;
            globalDataObj.locationInfo.longitude = longitude;
            // 根据经纬度获取地理位置
            app.getAddressByLatLng({
              lat: latitude,
              lng: longitude
            }, function (res) {
              let returnData = res.data;
              // 地址信息保存到全局变量
              globalDataObj.locationInfo.info = returnData;
              let city = returnData.ad_info.city;
              let len = city && city.length;
              if (len) {
                // 把“市”字去掉
                city = city.charAt(len - 1) === '市' ? city.substring(0, len - 1) : city;
              }
              that.setData({
                'locationCity.selectedCity': city,
                'locationCity.city': city,
                'locationCity.location.lat': latitude,
                'locationCity.location.lng': longitude
              });
            })
          }
        },
        fail: function(res) {
          app.showModal({
            title: '请重新授权地理位置',
            content: '注：授权定位后才可获取你附近的商家',
            showCancel: true,
            cancelColor: '#666',
            confirmColor: '#ff7100',
            confirm: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success(res) {
                    console.log(res.authSetting)
                  }
                })
              }
            },
            cancel: function () {
              let city = globalDataObj.dMChooseCity && globalDataObj.dMChooseCity.city || '';
              let cityTip = ''; 
              if (city === '') {
                cityTip = '暂无'
              } else {
                cityTip = city;
              }
              that.setData({
                'locationCity.selectedCity': cityTip,
                'locationCity.city': '定位失败'
              });
            }
          })
        }
      });
    } else {
      // 获取全局位置信息
      let globalLocation = globalDataObj.dMChooseCity || info.ad_info;
      // 当前选中的城市
      let selectedCity = globalLocation && globalLocation.city;
      if (selectedCity) {
        let selectLen = selectedCity.length;
        selectedCity = selectedCity.charAt(selectLen - 1) === '市' ? selectedCity.substring(0, selectLen - 1) : selectedCity;
      }
      // 获取当前的城市名
      let city = info.ad_info && info.ad_info.city;
      // 城市名长度
      let len = city && city.length;
      if (len) {
        city = city.charAt(len - 1) === '市' ? city.substring(0, len - 1) : city;
      }
      this.setData({
        'locationCity.selectedCity': selectedCity,
        'locationCity.city': city,
        'locationCity.id': '',
        'locationCity.location.lat': info.ad_info.location.lat,
        'locationCity.location.lng': info.ad_info.location.lng
      });
    }
  },
  /**
   * 获取所有城市
   */
  getAllCitys: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=CrossPlatform/PositionList',
      hideLoading: true,
      success: function(res) {
        that.setData({
          citys: res.data || []
        });
      }
    })
  },
  /**
   * 获取历史访问过的城市
   */
  getHistoryCitys: function() {
    let that = this;
    // 获取最近访问的城市
    wx.getStorage({
      key: 'dMHistoryCitys',
      success: function(res) {
        let temArr = [];
        let returnData = res.data;
        let len = returnData && returnData.length;
        if (len > 3) {
          // 只显示最近访问的三个城市
          returnData.splice(3, len - 3);
        }
        that.setData({
          historyCitys: returnData
        });
      },
    });
  },
  /**
   * 搜索框输入处理
   */
  searchInputHandler: function(e) {
    let dataObj = this.data;
    let inputVal = e.detail.value;
    // 如果输入为空则现在所有城市并返回
    if (inputVal === null || inputVal.trim() === '') {
      this.setData({
        isHideSearchResult: true
      })
      return;
    }

    // 存放搜索结果的数组
    let citysResultArr = [];
    // 所有城市
    let citysArr = dataObj.citys;

    for (let i = 0, cLen = citysArr.length; i < cLen; i++) {
      // 遍历某个字母下所有城市
      for (let j = 0, dLen = citysArr[i].data.length; j < dLen; j++) {
        // 城市名
        let cityName = citysArr[i].data[j].name,
          // 城市拼音
          cityPinyin = citysArr[i].data[j].pinyin;
        // 判断是否匹配
        if (cityName.indexOf(inputVal) === 0 || cityPinyin.indexOf(inputVal.toLowerCase()) === 0) {
          // 判断当前搜索结果城市是否有该城市
          let isHas = false;
          for (let k = 0, tLen = citysResultArr.length; k < tLen; k++) {
            if (citysResultArr[k].id == citysArr[i].data[j].id) {
              isHas = true;
              break;
            }
          }
          // 如果没有则添加到城市搜索结果里
          if (!isHas) {
            citysResultArr.push(citysArr[i].data[j]);
          }
        }
      }
    }
    this.setData({
      isHideSearchResult: false,
      searchCitys: citysResultArr
    })
  },
  /**
   * 选择城市
   */
  chooseCity: function(e) {
    let that = this,
      dataObj = this.data,
      datasetObj = e.target.dataset;

    // 访问过的城市数组
    let historyCitys = dataObj.historyCitys;

    // 全局位置信息
    let cityName = datasetObj.cityName,
      cityId = datasetObj.id || '',
      cityLat = datasetObj.lat || '',
      cityLng = datasetObj.lng || '',
      cityObj = {
        'city': cityName,
        'id': cityId,
        'location': {
          'lat': cityLat,
          'lng': cityLng
        }
      };
    // 点击定位失败不做任何操作
    if (cityName === '定位失败') {
      return;
    }
    // 将选中的城市保存到全局变量
    app.globalData.dMChooseCity = cityObj;
    // 判断选中的城市是否在缓存中
    let flage = true;
    let cityIndex = 0;
    for (let i = 0, len = historyCitys.length; i < len; i++) {
      if (historyCitys[i].id == cityObj.id) {
        flage = false;
        cityIndex = i;
      }
    }
    // 没有重复
    if (flage) {
      cityObj.city = cityName;
      historyCitys.unshift(cityObj);
    } else {
      // 重复 删除原来的城市并将重复的城市放到首位
      historyCitys.splice(cityIndex, 1);
      historyCitys.unshift(cityObj);
    }
    // 设置缓存
    wx.setStorage({
      key: 'dMHistoryCitys',
      data: historyCitys,
    });
    // 参数改变商家列表需要重新刷新数据
    app.globalData.dMParamIsChange = true;
    // 返回上一页
    app.turnBack();
  },
  /**
   * 首字母城市选择
   */
  chooseInitialCitys: function(e) {
    let that = this,
      dataObj = this.data,
      datasetObj = e.currentTarget.dataset;
    // 选中的字母
    let clickInitial = datasetObj.value;
    // 判断是否需要滚动，如果点击和上一次一样则不滚动
    this.pageScrollToById(clickInitial);;
    this.setData({
      selectedInitial: clickInitial,
      isHideInitial: false
    });
  },
  /**
   * 滑动选择城市
   */
  moveInitialCitys: function(e) {
    let that = this,
      dataObj = this.data;

    // 计算移动后的字母
    let moveY = e.touches[0].clientY;
    let targetIndex = Math.ceil((moveY - 100) / 22) - 1;
    // 判断移动是否超出范围，最大只能到Z
    targetIndex = targetIndex > 21 ? 21 : targetIndex;
    // 移动后的字母
    let nowInitial = dataObj.initialArr[targetIndex];
    // 判断是否移动到了不同的字母，同一个字母不做任何操作
    if (nowInitial === dataObj.selectedInitial || !nowInitial) {
      return;
    } else {
      this.setData({
        selectedInitial: nowInitial,
        isHideInitial: false
      });
      // 有定时器先清除
      if (this.touchStopTimer) {
        clearTimeout(this.touchStopTimer);
      }
      // 防止频繁调用
      this.touchStopTimer = setTimeout(() => {
        this.pageScrollToById(nowInitial);
      }, 200);
    }
  },
  /**
   * 选择城市touch结束
   */
  chooseTouchEnd: function() {
    let that = this;
    // 有定时器先清除
    if (this.touchEndTimer) {
      clearInterval(this.touchEndTimer);
    }
    // 开启新的定时器，2s后消息
    this.touchEndTimer = setTimeout(function() {
      that.setData({
        isHideInitial: true
      });
    }, 1500);
  },
  /**
   * 根据id滚动到指定地方
   */
  pageScrollToById: function(id) {
    // 根据id滚动到指定位置
    let query = wx.createSelectorQuery()
    query.select('#' + id).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function(res) {
      let top = res[0].top + res[1].scrollTop;
      wx.pageScrollTo({
        scrollTop: top - 52,
        duration: 0
      })
    });
  },
})