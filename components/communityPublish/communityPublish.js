
var app = getApp();
var util = require('../../utils/util.js');
var articleData =  {
  title: '',
  text : '',
  imgs : [],
  section_id: '',
  category_id : '',
  phone: '',
  latitude: '',
  longitude: '',
  type: 0,
  origin_url: ''
};
var isSubmiting = false;

var routeIsCommunityPage = function () {
  return /^informationManagement/.test(getCurrentPages().pop().__route__);
}

Component({
  properties: {
    // 这里定义了传进来的对象属性，属性值可以在组件使用时指定
    communityPublish: {
      type: Object,
      value: {
        show: false,
        publishType: 0,
        detail: '',
        articleId: '',
        from: '',
        franchisee: '',
        reqAudit: ''
      },
      observer: function (newVal, oldVal, changedPath) {
        if (!newVal) { //初始化时不调用
          return;
        }
        let defaultValue = {
              publishType: 0,
              detail: '',
              articleId: '',
              from: '',
              franchisee: '',
              reqAudit: ''
          },
          newOptions = Object.assign({}, defaultValue, newVal);
        this.onLoad(newOptions);
      }
    }
  },
  data: {
    communityPublish: {
      show: true,
      publishType: 0,
      detail: '',
      articleId: '',
      from: '',
      franchisee: '',
      reqAudit: ''
    },
    communityId: '',
    articleData : {
      title : '',
      text: '',
      imgs : [],
      section_id: '',
      category_id: '',
      phone: '',
      latitude: '',
      longitude: '',
      type: 0,
      origin_url: ''
    },
    address: '',
    theme_color : '',
    selectedClassify: '',
    require_audit: '',
    require_loc: true,
    require_phone: true,
    fromCommunityPage: false,
    showSlectWindow: false,
    showClassifyBox: false,
    showCategoryList: false,
    selectedSectionIndex: '',
    selectedSectionName: '',
    sectionList: [],
    selectedCategoryIndex: '',
    selectedCategoryName: '',
    categoryList: []
  },
  methods: {
    onLoad: function (options) {
      let that = this;
      let {
        publishType,
        detail,
        articleId,
        from,
        franchisee,
        reqAudit
      } = options;

      app.getStorage({
        key: 'communityThemeColor-' + detail,
        success: function (res) {
          that.setData({ theme_color: res.data });
        }
      })

      this.setData({
        'communityId': detail || '',
        'articleId': articleId || '',
        'require_audit': reqAudit || '',
        'articleData.section_id': detail || '',
        'fromCommunityPage': from || '',
        'type': publishType == 2 ? 'link' : 'default',
        'articleData.type': publishType,
        'franchisee': franchisee || ''
      });

      if (articleId) {
        this.getArticle(articleId);
      } else {
        this.getSections(detail);
      }
    },
    submitData: function (event) {
      let that = this,
        title = articleData.title,
        text = articleData.text,
        need_loc = that.data.require_loc,
        need_phone = that.data.require_phone,
        latitude = need_loc ? that.data.articleData.latitude : '',
        longitude = need_loc ? that.data.articleData.longitude : '',
        address = need_loc ? that.data.address : '',
        phone = need_phone ? articleData.phone : '',
        communityId = this.data.communityId || this.data.articleData.section_id,
        categoryId = this.data.articleData.category_id,
        type = this.data.articleData.type || 0,
        origin_url = articleData.origin_url || this.data.articleData.origin_url || '';


      if (!title) {
        app.showModal({ content: '请填写标题' });
        return;
      } else if (title.length > 46) {
        app.showModal({ content: '标题字数不得超过46' });
        return;
      } else { }

      if (this.data.type == 'default') {
        if (!text) {
          app.showModal({ content: '请填写话题内容' });
          return;
        }
      } else if (this.data.type == 'link') {
        if (!origin_url) {
          app.showModal({ content: '请粘贴公众号文章或腾讯视频链接' });
          return;
        }
      } else { }
      if (!this.data.selectedSectionName || !this.data.selectedCategoryName) {
        app.showModal({ content: '请选择分类' });
        return;
      }

      let url = '/index.php?r=AppSNS/AddArticle';
      let article_id = that.data.articleId;

      if (article_id) {
        url = '/index.php?r=AppSNS/UpdateArticle';
      }

      if (isSubmiting) {
        app.showModal({
          content: '正在提交中，请勿重复点击',
          complete: function () {
            !isSubmiting && that.returnBack();
          }
        });
        return;
      }
      isSubmiting = true;

      let submitParams = {
        article_id: article_id,
        section_id: communityId || this.data.sectionList[this.data.selectedSectionIndex].id, //版块id
        category_id: categoryId || this.data.categoryList[this.data.selectedCategoryIndex].id, //分类id 可不传
        title: title,
        text: text,
        imgs: that.data.articleData.imgs,
        is_carousel: 0, //是否开启轮播 1为开启 0不开启
        top_flag: 0, //是否置顶 1为置顶 0不置顶
        hot_flag: 0, //是否精品 1是 0否
        phone: phone,
        latitude: latitude,
        longitude: longitude,
        address: address,
        type: type,
        origin_url: origin_url,
        sub_app_id: that.data.franchisee
      }

      if (that.data.articleData.imgs.length > 0) {
        that.wxImgsCheck(that.data.articleData.imgs)
          .then(function () {
            that.afterCheckSubmitData(url, submitParams);
          }, function (res) {
            app.showModal({ content: res && res.data || '网络错误或图片审核不通过' });
            isSubmiting = false;
          });
      } else {
        if (type == 2) {
          that.checkGrabLinkIsOk(origin_url).then(function (res) {
            if (!!res.unSupportable) {
              app.showModal({
                title: '提示',
                content: res.data || '暂不支持抓取含音频|视频|投票|小程序的图文文章',
                showCancel: true,
                confirmText: '继续',
                cancelText: '放弃',
                confirm: function () {
                  that.afterCheckSubmitData(url, submitParams);
                },
                cancel: function () {
                  isSubmiting = false;
                }
              });
            } else {
              that.afterCheckSubmitData(url, submitParams);
            }
          }, function () {
            isSubmiting = false;
          });
        } else {
          that.afterCheckSubmitData(url, submitParams);
        }
      }
    },
    afterCheckSubmitData: function (url, data) {
      let that = this;
      app.sendRequest({
        hideLoading: true,
        url: url,
        data: data,
        method: 'post',
        success: function (res) {
          let content = that.data.require_audit == 1 ? '提交成功，待审核' : '提交成功';
          app.showModal({
            content: content,
            complete: function () {
              articleData.title = '';
              articleData.text = '';
              that.returnBack();
              if (routeIsCommunityPage()) {
                app.globalData.communityPageRefresh = true;
              }else {
                app.globalData.topicRefresh = true;
              }
              getCurrentPages().pop().onShow(); // 主动刷新页面
            }
          });
          app.globalData.communityPageRefresh = true;
          app.globalData.communityUsercenterRefresh = true;
        },
        complete: function (res) {
          isSubmiting = false;
        }
      });
    },
    bindTitleInput: function (event) {
      let val = event.detail.value;
      articleData.title = val;
    },
    bindTextInput: function (event) {
      let val = event.detail.value;
      articleData.text = val;
    },
    bindTextBlur: function (event) {
      let val = event.detail.value;
      articleData.text = val;
      this.setData({
        'articleData.text': val,
        'articleData.viewtext': val.replace(/\\n/g, '\n')
      });
    },
    bindPhoneInput: function (event) {
      let val = event.detail.value;
      articleData.phone = val;
    },
    bindPhoneBlur: function (event) {
      let val = event.detail.value;
      this.setData({ 'articleData.phone': val });
    },
    uploadImg: function () {
      var that = this,
        imgs = that.data.articleData.imgs;

      app.chooseImage(function (imageUrls) {
        imgs = imgs.concat(imageUrls);
        that.setData({
          'articleData.imgs': imgs
        });
      }, 9);
    },
    deleteImg: function (event) {
      var index = event.currentTarget.dataset.index,
        imgs = this.data.articleData.imgs;

      imgs.splice(index, 1);
      this.setData({
        'articleData.imgs': imgs
      });
    },
    getSections: function (communityId, callback) {
      var that = this,
        param = {
          page: -1,
          sub_app_id: that.data.franchisee
        };
      if (communityId) {
        param.page = 1;
        param.section_id = communityId;
      }
      app.sendRequest({
        url: '/index.php?r=AppSNS/GetSectionByPage',
        data: param,
        method: 'post',
        success: function (res) {
          let newdata = {};
          let sec = res.data[0];
          newdata.require_loc = sec.require_location == 1;
          newdata.require_phone = sec.require_phone == 1;
          if (!that.data.theme_color) {
            newdata.theme_color = sec.theme_color;
          }
          if (communityId) {
            newdata['selectedSectionName'] = sec.name;
            newdata['require_audit'] = sec.require_audit;
            newdata['showCategoryList'] = true;
          }
          newdata['sectionList'] = res.data;
          that.setData(newdata);
          that.getCategory(communityId || res.data[0].id);
          typeof callback == 'function' && callback(res.data);
        }
      });
    },
    getCategory: function (sectionId, callback) {
      var that = this;
      app.sendRequest({
        url: '/index.php?r=AppSNS/GetCategoryByPage',
        data: {
          section_id: sectionId || that.data.communityId,
          page: -1,
          page_size: 100,
          sub_app_id: that.data.franchisee
        },
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let info = res.data,
              newdata = [{ id: '', name: '全部(默认)' }].concat(info);
            that.setData({ 'categoryList': newdata });
            typeof callback == 'function' && callback(newdata);
          }
        }
      });
    },
    getArticle: function (article_id) {
      var that = this;
      app.sendRequest({
        url: '/index.php?r=AppSNS/GetArticleByPage',
        data: {
          article_id: article_id,
          only_own_record: 1,
          sub_app_id: that.data.franchisee
        },
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let info = res.data[0],
              newdata = {};

            newdata['communityId'] = info.section_id;
            newdata['articleData.title'] = info.title;
            newdata['articleData.text'] = info.content.text;
            newdata['articleData.viewtext'] = info.content.text.replace(/\\n/, '\n');
            newdata['articleData.imgs'] = info.content.imgs || [];
            newdata['articleData.phone'] = info.phone;
            newdata['articleData.section_id'] = info.section_id;
            newdata['articleData.category_id'] = info.category_id;
            newdata['articleData.latitude'] = info.latitude;
            newdata['articleData.longitude'] = info.longitude;
            newdata['articleData.origin_url'] = info.content.origin_url;
            newdata['articleData.view_origin_url'] = info.content.origin_url.replace(/\\n/, '\n');
            newdata['address'] = info.address;

            articleData.title = info.title;
            articleData.text = info.content.text;

            // that.getLocByLatAndLng(info.latitude, info.longitude, function (data) {
            //   that.setData({ address: data.address });
            // })

            that.getSections(info.section_id);
            that.getCategory(info.section_id, function (data) {
              data.some((cate, cateIdx) => {
                that.setData({
                  'selectedCategoryIndex': cateIdx,
                  'selectedCategoryName': cate.name,
                  'showCategoryList': true
                });
              });
            });

            that.setData(newdata);
          }
        }
      });
    },
    getAddress: function () {
      let that = this;
      wx.chooseLocation({
        success: function (res) {
          if (!res.longitude) {
            app.showModal({
              content: '请选择具体的地址'
            });
            return;
          }
          that.setData({
            'articleData.latitude': res.latitude,
            'articleData.longitude': res.longitude,
            'address': res.address || ''
          });
          if (!res.address) {
            that.getLocByLatAndLng(res.latitude, res.longitude, function (data) {
              that.setData({ address: data.address });
            })
          }
        },
        fail: function () { },
        complete: function () { }
      })
    },
    addressInput: function (event) {
      if (event.detail.value) {
        this.setData({
          'articleData.latitude': '',
          'articleData.longitude': '',
          'address': ''
        });
      }
    },
    getLocByLatAndLng: function (lat, lng, cb) {
      app.sendRequest({
        url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
        data: {
          latitude: lat,
          longitude: lng
        },
        method: 'post',
        success: function (data) {
          if (data.status == 0 && typeof cb == 'function') {
            cb(data.data);
          }
        }
      })
    },
    showClassifyBox: function () {
      let showFlag = this.data.showClassifyBox;
      this.setData({ showClassifyBox: !showFlag });
      if (!this.data.articleData.category_id) {
        this.setData({
          'articleData.category_id': 0,
          selectedClassify: '全部（默认）'
        });
      }
    },
    showSlectWindowAct: function () {
      if (this.data.showSlectWindow && this.data.selectedCategoryName && !this.data.showCategoryList) {
        this.setData({
          'showCategoryList': true
        });
      }
      this.setData({
        'showSlectWindow': !this.data.showSlectWindow
      });
    },
    selectSectionAct: function (e) {
      let currentTarget = e.currentTarget,
        dataset = currentTarget.dataset,
        secIndex = dataset.index,
        currentSection = this.data.sectionList[secIndex];
      this.setData({
        'selectedSectionIndex': secIndex,
        'selectedSectionName': currentSection.name,
        'require_audit': currentSection.require_audit,
        'require_loc': currentSection.require_location == 1,
        'require_phone': currentSection.require_phone == 1,
        'selectedCategoryIndex': '',
        'selectedCategoryName': '',
        'showCategoryList': true
      });
      this.getCategory(currentSection.id);
    },
    selectCategoryAct: function (e) {
      let currentTarget = e.currentTarget,
        dataset = currentTarget.dataset,
        cateIndex = dataset.index,
        currentCategory = this.data.categoryList[cateIndex];
      this.setData({
        'selectedCategoryIndex': cateIndex,
        'selectedCategoryName': currentCategory.name,
        'showSlectWindow': false
      });
    },
    changeShowListAct: function () {
      if (this.data.fromCommunityPage) {
        return;
      }
      this.setData({
        'showCategoryList': !this.data.showCategoryList
      });
    },
    stopPropagation: function () {

    },
    bindTextFocus: function () {
      this.data.showSlectWindow && this.showSlectWindowAct();
    },
    bindLinkInput: function (e) {
      let articlelinkInput = e.detail.value;
      articleData.origin_url = articlelinkInput;
    },
    bindLinkBlur: function (e) {
      let articlelink = e.detail.value;
      articleData.origin_url = articlelink;
      this.setData({
        'articleData.origin_url': articlelink,
        'articleData.view_origin_url': articlelink.replace(/\\n/g, '\n')
      });
    },
    imgCheck: function (img) {
      return new Promise(function (resolve, reject) {
        app.sendRequest({
          url: '/index.php?r=AppShop/ImgSecCheck',
          data: { imgs: [img] },
          method: 'post',
          success: function (res) {
            resolve(img);
          },
          complete: function (res) {
            if (!res || res.status != 0) {
              reject(res);
            }
          }
        })
      });
    },
    wxImgsCheck: function (arr) {
      return Promise.all(arr.map(img => this.imgCheck(img)));
    },
    checkGrabLinkIsOk: function (url) {
      return new Promise(function (resolve, reject) {
        app.sendRequest({
          url: '/index.php?r=AppShop/WechatUrlCheck',
          data: { url },
          success: function (res) {
            resolve(res);
          },
          complete: function (res) {
            if (!res || res.status != 0) {
              reject(res);
            }
          }
        });
      });
    },
    returnBack: function () {
      this.setData({
        'communityPublish.show': false,
        showCategoryList: false,
        articleData: {
          title: '',
          text: '',
          imgs: [],
          section_id: '',
          category_id: '',
          phone: '',
          latitude: '',
          longitude: '',
          type: 0,
          origin_url: '',
          viewtext: '',
          view_origin_url: ''
        },
        selectedSectionIndex: '',
        selectedSectionName: '',
        selectedCategoryIndex: '',
        selectedCategoryName: '',
        address: ''
      });
      articleData = {
        title: '',
        text: '',
        imgs: [],
        section_id: '',
        category_id: '',
        phone: '',
        latitude: '',
        longitude: '',
        type: 0,
        origin_url: ''
      };
      app.closeCommunityPublishModal();
    },
    pageTouchMove: function () {
      if (this.data.pageMoving) {
        return;
      }
      this.setData({pageMoving: true});
    },
    pageTouchEnd: function () {
      this.setData({pageMoving: false});
    }
  }
})
