
/**
 * utils函数引入
 **/
// import showdown from './showdown.js';
import HtmlToJson from './html2json.js';
/**
 * 配置及公有属性
 **/
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function (res) {
    realWindowWidth = res.windowWidth
    realWindowHeight = res.windowHeight
  }
})
/**
 * 主函数入口区
 **/
function wxParse(bindName = 'wxParseData', type='html', data='<div class="color:red;">数据不能为空</div>', target,imagePadding) {
  var that = target;
  var transData = {};//存放转化后的数据
  if (type == 'html') {
    transData = HtmlToJson.html2json(data, bindName);
  }
  // else if (type == 'md' || type == 'markdown') {
  //   var converter = new showdown.Converter();
  //   var html = converter.makeHtml(data);
  //   transData = HtmlToJson.html2json(html, bindName);
  // }
  transData.view = {};
  transData.view.imagePadding = 0;
  if(typeof(imagePadding) != 'undefined'){
    transData.view.imagePadding = imagePadding
  }
  
  that.wxParseImgTap = wxParseImgTap;
  that.wxParseImgLoad = wxParseImgLoad;
  if(bindName == getApp().getWxParseOldPattern()){
    // that.wxParseImgTap = function(){};
    return transData.nodes;
  } else {
    var bindData = {};
    bindData[bindName] = transData;
    that.setData(bindData)
    that.wxParseImgTap = wxParseImgTap;
    return transData.nodes;
  }
}
// 图片点击事件
function wxParseImgTap(e) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    var data = getDataKey(that.data, tagFrom);
    var imageUrls = [nowImgUrl];
    if (data && data.imageUrls){
      imageUrls = data.imageUrls;
    }else{
      imageUrls = getImgUrl(data);
    }
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      urls: imageUrls // 需要预览的图片http链接列表
    })
  }
}

function getImgUrl(data){
  let imgArr = [];
  for (let i = 0; i < data.length; i++) {
    let node = data[i];
    if (node.tag == 'img'){
      imgArr.push(node.attr.src);
    }else if (node.nodes){
      let img = getImgUrl(node.nodes);
      imgArr = imgArr.concat(img);
    }
  }
  return imgArr;
}

/**
 * 图片视觉宽高计算函数区 
 **/
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var index = e.target.dataset.index;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, index, that, tagFrom)
  } 
}
// 假循环获取计算图片视觉最佳宽高
function calMoreImageInfo(e, index, that, bindName) {
  var temData = getDataKey(that.data, bindName);
  if (!temData) {
    return;
  }
  // var temImages = temData.images;
  //因为无法获取view宽度 需要自定义padding进行计算，稍后处理
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, that, temData); 

  // var index = temImages[idx].index
  var key = `${bindName}`;
  if (temData && temData.nodes){
    for (var i of index.split('.')) key+=`.nodes[${i}]`;
  }else{
    let keyArr = index.split('.');
    for (let i = 0; i < keyArr.length; i++){
      if(i == 0){
        key += `[${keyArr[i]}]`;
      }else{
        key += `.nodes[${keyArr[i]}]`;
      }
    }
  }
  var keyW = key + '.width';
  var keyH = key + '.height';
  that.setData({
    [keyW]: recal.imageWidth,
    [keyH]: recal.imageheight,
  })
}

// 计算视觉优先的图片宽高
function wxAutoImageCal(originalWidth, originalHeight, that, temData) {
  //获取图片的原始长宽
  var windowWidth = 0, windowHeight = 0;
  var autoWidth = 0, autoHeight = 0;
  var results = {};

  var padding = (temData && temData.view) ? temData.view.imagePadding : 0;
  windowWidth = realWindowWidth-2*padding;
  windowHeight = realWindowHeight;
  //判断按照那种方式进行缩放
  // console.log("windowWidth" + windowWidth);
  if (originalWidth > windowWidth) {//在图片width大于手机屏幕width时候
    autoWidth = windowWidth;
    // console.log("autoWidth" + autoWidth);
    autoHeight = (autoWidth * originalHeight) / originalWidth;
    // console.log("autoHeight" + autoHeight);
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;
  } else {//否则展示原来的数据
    results.imageWidth = originalWidth;
    results.imageheight = originalHeight;
  }
  return results;
}

function getDataKey(data, key){
  key = key.split('.');
  for (let i = 0; i < key.length; i++) {
    data = data[key[i]];
  }
  return data;
}

function wxParseTemArray(temArrayName,bindNameReg,total,that){
  var array = [];
  var temData = that.data;
  var obj = null;
  for(var i = 0; i < total; i++){
    var simArr = temData[bindNameReg+i].nodes;
    array.push(simArr);
  }

  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"'+ temArrayName +'":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}

/**
 * 配置emojis
 * 
 */

function emojisInit(reg='',baseSrc="/wxParse/emojis/",emojis){
   HtmlToJson.emojisInit(reg,baseSrc,emojis);
}

module.exports = {
  wxParse: wxParse,
  wxParseTemArray:wxParseTemArray,
  emojisInit:emojisInit
}


