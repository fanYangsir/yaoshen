function formatTime(date) {
  if(!date){
    date = new Date();
  }

  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds();


  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function formatDistance(distance) {
  if (!distance){
    return 0;
  }
  distance = +distance;
  return distance < 1000 ? Math.round(distance) + 'm' : (distance/1000).toFixed(1) + 'km';
}

function isPlainObject(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
}

function isPhoneNumber(num) {
  return /^1\d{10}$/.test(num);
}

/*获取当前页url*/
function getCurrentPageUrl() {
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  var url = currentPage.route;
  return url;
}

/*获取当前页带参数的url*/
function getCurrentPageUrlWithArgs() {
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  var url = currentPage.route;
  var options = currentPage.options;
  var urlWithArgs = url + '?';
  for (var key in options) {
    var value = options[key];
    urlWithArgs += key + '=' + value + '&';
  }
  urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1);
  return urlWithArgs;
}

function getGoodsTypeByForm(form) {
  switch (form) {
    case 'goods':
      return 0;
    case 'appointment':
      return 1;
    case 'waimai':
      return 2;
    case 'tostore':
      return 3;
    default:
      return 0;
  }
}

function getFormByGoodsType(gt) {
  var type = +gt || 0;
  switch (type) {
    case 0:
      return 'goods';
    case 1:
      return 'appointment';
    case 2:
      return 'waimai';
    case 3:
      return 'tostore';
    default:
      return 'goods';
  }
}

function __each(arr, func) {
  var res = [];
  for (var k in arr) {
    res.push(func.call(this, arr[k], k));
  }
  return res;
}

function __filter(arr, func) {
  var res = [];
  __each(arr, function (v) {
    if (func(v)) {
      res.push(v);
    }
  })
  return res;
}

function __reduce(arr, func, init) {
  var res = init;
  var self = this;
  if (res === undefined) {
    res = arr[0];
    arr = arr.slice(1);
  }
  __each(arr, function (v, k) {
    res = func.call(self, res, v, k, arr);
  })
  return res;
}

function createAttrArr(attrStr) {
  var attrArr = attrStr.split(/[.\[\]]/) || [],
    func = function (v) {
      return v;
    },
    func2 = function (v) {
      return /^\d+$/.test(v) ? +v : v;
    };
  return __each(__filter(attrArr, func), func2);
}

function getValueByAttrStr(obj, attrStr) {
  var func = function (o, k) {
    return o && o[k];
  }
  return __reduce(createAttrArr(attrStr), func, obj);
}

module.exports = {
  formatTime: formatTime,
  isPlainObject: isPlainObject,
  isPhoneNumber: isPhoneNumber,
  formatDistance: formatDistance,
  getCurrentPageUrl: getCurrentPageUrl,
  getCurrentPageUrlWithArgs: getCurrentPageUrlWithArgs,
  getGoodsTypeByForm: getGoodsTypeByForm,
  getFormByGoodsType: getFormByGoodsType,
  getValueByAttrStr: getValueByAttrStr
}


