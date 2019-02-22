const app = getApp();

Component({
  // 定义传进来的对象属性，属性值可以在组件使用时指定
  properties: {
    sinkingModalData: {
      type: Object,
      value: {
        showModal: false,
        isSinking: false,
        pushContent: '',
        eventParams: {}
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 组件内部数据
    sinkingModalData: {
      showModal: false, // 是否显示弹窗
      isSinking: false, // 是否下沉动画
      pushContent: '',  // 推送内容
      eventParams: {}   // 点击事件
    },
  },

  ready: function () {
    this.getUserSetNoticesList();
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 获取用户设置的下沉弹窗信息
    getUserSetNoticesList: function () {
      let that = this;
      let newData = {};
      app.sendRequest({
        url: '/index.php?r=EventMessage/GetEventNoticeList',
        hideLoading: true,
        success: function (res) {
          let noticesData = res.data;
          let isEmpty = !noticesData || JSON.stringify(noticesData) === '[]' || JSON.stringify(noticesData) === '{}';
          if (isEmpty) {
            return false;
          }
          // 弹窗id
          newData['sinkingModalData.id'] = res.id;
          // 点击事件的参数
          let eventParams = noticesData.page_url;
          eventParams = typeof eventParams === 'string' ? JSON.parse(eventParams) : eventParams;
          newData['sinkingModalData.eventParams'] = eventParams;
          // 是否显示弹窗
          newData['sinkingModalData.showModal'] = true;
          // 是否有下沉动画
          newData['sinkingModalData.isSinking'] = true;
          // 推送文案
          newData['sinkingModalData.pushContent'] = noticesData.content || '';
          that.setData(newData);
          // 弹窗2s后消失
          setTimeout(function () {
            that.setData({
              'sinkingModalData.isSinking': false,
            });
          }, 3000);
        },
        fail: function (res) {
          console.log(res);
        }
      });
    },
    // 用户设置的点击事件跳转
    tapEventCommonHandler: function(e) {
      let id = this.data.sinkingModalData.id || '';
      app.sendRequest({
        url: '/index.php?r=EventMessage/SetMsgReadById',
        hideLoading: true,
        data: {
          'msg_id': id
        },
        success: function () {
          app.tapEventCommonHandler(e);
        }
      });
    }
  }
})
