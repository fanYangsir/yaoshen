var app = getApp();

Page({
  data: {
    favoritesStatus: [{ 'name': '全部', 'status': 0 }, { 'name': '失效', 'status': 2 }, { 'name': '降价中', 'status': 3 }, { 'name': '低库存', 'status': 4 }],
    selectAll: false,
    showCheckedBox: false,
    favoritesList: [],
    selectStatus: 0,
    unSaleGoodsCount: 0,
    reducePriceGoodsNum: 0,
    hideTips: false,
    showReducePrice: true,
    search: '',
  },
  page: 1,
  isMore: 1,
  onLoad: function (options) {
    this.dataInitial();
  },
  onReady: function () {
    
  },
  onShow: function () {
    
  },
  dataInitial: function(){
    this.getFavoriteGoodsList();
    this.getAppECStoreConfig();
  },
  getFavoriteGoodsList: function(){
    let _this = this;
    let favoritesStatus = this.data.favoritesStatus;
    app.sendRequest({
      url: '/index.php?r=AppShop/favoriteGoodsList',
      data: {
        page: _this.page,
        page_size: 10,
        status: favoritesStatus[_this.data.selectStatus].status,
        search: _this.data.search
      },
      success: function(res){
        _this.setData({
          favoritesList: _this.data.favoritesList.concat(res.data),
          unSaleGoodsCount: res.un_sale_goods_count || 0,
          reducePriceGoodsNum: res.reduce_price_goods_num || 0
        })
        _this.isMore = res.is_more;
      }
    })
  },
  addShoppingCart: function(event){
    this.selectComponent('#component-goodsShoppingCart').showDialog({goodsId: event.currentTarget.dataset.id});
  },
  selectGoods: function(event){
    let index = event.currentTarget.dataset.index;
    let favoritesList = this.data.favoritesList;
    let selectAll = true;

    favoritesList[index].selected = !favoritesList[index].selected;
    favoritesList.map((item) => {
      if(!item.selected)
      selectAll = false;  
    })
    this.setData({
      favoritesList: favoritesList,
      selectAll: selectAll
    })
  },
  clickSelectAll: function(){
    let _this = this;
    let selectAll = this.data.selectAll;
    let favoritesList = this.data.favoritesList;
    favoritesList.map((item) => {
      item.selected = !selectAll
    })
    this.setData({
      favoritesList: favoritesList,
      selectAll: !selectAll
    })
  },
  onReachBottom: function () {
    if (!this.isMore) { return };
    this.page++;
    this.getFavoriteGoodsList();
  },
  selectFavoritesStatus: function(event){
    this.setData({
      favoritesList: [],
      selectStatus: event.detail.value 
    })
    this.page = 1;
    this.getFavoriteGoodsList();
  },
  searchFavoritesGoods: function(event){
    this.page = 1;
    this.setData({
      search: event.detail.value,
      favoritesList: []
    })
    this.getFavoriteGoodsList();
  },
  deleteGoods: function(){
    let _this = this;
    let deleteIdArr = [];
    let favoritesList = this.data.favoritesList;
    for (let i = 0; i < favoritesList.length;i++){
      if (favoritesList[i].selected) {
        deleteIdArr.push(favoritesList[i].id);
        favoritesList.splice(i, 1);
        i--;
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteFavoriteGoods',
      method: 'post',
      data: {
        goods_id_arr: deleteIdArr
      },
      success: function (res) {
        _this.setData({
          favoritesList: favoritesList,
          showCheckedBox: false
        })
      }
    })
  },
  favoritesOperat: function(){
    this.setData({
      showCheckedBox: true
    })
  },
  favoritesComplete: function(){
    this.setData({
      showCheckedBox: false
    })
  },
  cleanUpGoods: function(){
    this.setData({
      selectStatus: 1,
      favoritesList: []
    })
    this.page = 1;
    this.getFavoriteGoodsList();
  },
  hideTips: function(){
    this.setData({
      hideTips: true
    })
  },
  goHomePage: function(){
    let router = app.getHomepageRouter();
    app.reLaunch({ url: '/pages/' + router + '/' + router });
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  },
  checkReducePrice: function(){
    this.setData({
      selectStatus: 2,
      showReducePrice: false,
      favoritesList: []
    })
    this.page = 1;
    this.getFavoriteGoodsList();
  },
  hideReducePrice: function(){
    this.setData({
      showReducePrice: false
    })
  },
  goGoodsDetail: function (event) {
    app.turnToPage('/pages/goodsDetail/goodsDetail?detail=' + event.currentTarget.dataset.id);
  }  
})