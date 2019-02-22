var app = getApp()

Component({
  properties: {
    // 这里定义了传进来的对象属性，属性值可以在组件使用时指定
    announce: {
      type: Object,
      observer: function(){
        this.initialAnnounce();
      }
    }
  },
  ready: function(){
    
  },
  data: {
    // 这里是一些组件内部数据
    interval:'',
    topFlag: true,
    scrollContentHeight: 0,
    isIconFlag: true
  },
  methods: {
    // 这里是一个自定义方法
    initialAnnounce: function(){
      if (this.properties.announce.customFeature.mode === 1 && this.properties.announce.content.length > 1){
        clearInterval(this.data.interval);
        this.scrollTopInterval();
      }
      if (this.properties.announce.customFeature.selectImg.indexOf('announce') >= 0){
        this.setData({
          isIconFlag: true
        })
      }else{
        this.setData({
          isIconFlag: false
        })
      }
    },
    scrollTopInterval: function() {
      this.data.interval = setInterval(() => {
        if (this.data.topFlag) {
          this.scrollTop();
        } else {
          this.scrollBottom();
        }
      }, this.properties.announce.customFeature.interval * 1000)
    },
    scrollTop: function() {
      let scrollContentHeight = +this.data.scrollContentHeight - +this.properties.announce.customFeature.height;
      let topFlag = '';
      if (scrollContentHeight == -this.properties.announce.customFeature.height * (this.properties.announce.content.length - 1)) {
        topFlag = false;
      }else{
        topFlag = true;
      }
      this.setData({
        scrollContentHeight: scrollContentHeight,
        topFlag: topFlag
      })
    },
    scrollBottom: function() {
      let scrollContentHeight = +this.data.scrollContentHeight + +this.properties.announce.customFeature.height;
      let topFlag = '';
      if (scrollContentHeight == 0) {
        topFlag = true;
      }else{
        topFlag = false;
      }
      this.setData({
        scrollContentHeight: scrollContentHeight,
        topFlag: topFlag
      })
    },
    tapEventCommonHandler: function(e){
      app.tapEventCommonHandler(e);
    }
  }
})