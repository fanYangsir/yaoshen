
var app = getApp()
var util = require('../../utils/util.js')

Component({
  properties: {
    // 这里定义了传进来的对象属性，属性值可以在组件使用时指定
    communityPublishType: {
      type: Object,
      value: {
        show: false,
        communityPublish: {}
      }
    }
  },
  data: {
    urlSearch: '',
    communityPublishType: {
      show: false,
      communityPublish: {}
    }
  },
  methods: {
    turnToCommunityPublish: function (e) {
      e.currentTarget.dataset = Object.assign({},e.currentTarget.dataset, this.data.communityPublishType.communityPublish);
      app.turnToCommunityPublish(e);
    },
    returnBack: function (e) {
      this.setData({
        'communityPublishType.show': false
      });
      app.closeCommunityPublishTypeModal();
    }
  }
})