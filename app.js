/**
 * 今天吃什么？小程序
 * 全局应用程序实例
 */
App({
  /**
   * 全局数据
   * foodHistory: 用户随机食物的历史记录
   * foodOptions: 可供随机选择的食物选项列表
   * defaultImage: 默认图片，用于图片加载失败时显示
   */
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '很久以前羊肉串', image: '/images/henjiuyiqian.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' },
      { name: '今日牛事', image: '/images/jinriniushi.png' },
      { name: '青鹤谷', image: '/images/qinghegu.png' },
      { name: '泰廊', image: '/images/tailang.png' },
      { name: '倍乐韩国', image: '/images/beilei.png' },
      { name: 'brownstone西班牙', image: '/images/brownstone.png' },
      { name: '梅果', image: '/images/meiguo.png' },
      { name: '烧烤', image: '/images/shaokao.png' }
    ],
    defaultImage: '/images/logo.png'
  },

  /**
   * 添加食物到历史记录
   * @param {Object} food - 食物对象，包含名称和图片路径
   */
  addToHistory: function(food) {
    const history = this.globalData.foodHistory;
    // 添加时间戳
    const foodWithTimestamp = {
      ...food,
      timestamp: new Date().toLocaleString()
    };
    
    // 将新记录添加到历史记录的开头
    history.unshift(foodWithTimestamp);
    
    // 限制历史记录最多保存20条
    if (history.length > 20) {
      history.pop();
    }
  },

  /**
   * 预加载所有食物图片，确保图片可用
   * 图片加载失败时使用默认图片替代
   */
  preloadImages: function() {
    const that = this;
    // 使用Promise.all等待所有图片加载
    const loadPromises = this.globalData.foodOptions.map((food, index) => {
      return new Promise((resolve) => {
        wx.getImageInfo({
          src: food.image,
          success: (res) => {
            // 图片加载成功，使用本地路径
            that.globalData.foodOptions[index].image = res.path;
            resolve();
          },
          fail: (err) => {
            console.error(`图片 ${food.image} 加载失败:`, err);
            // 图片加载失败，使用默认图片
            that.globalData.foodOptions[index].image = that.globalData.defaultImage;
            resolve();
          }
        });
      });
    });

    // 返回Promise以便调用者知道何时预加载完成
    return Promise.all(loadPromises);
  },

  /**
   * 生命周期函数--监听小程序初始化
   * 在小程序启动时执行，只触发一次
   * 可用于初始化全局数据、检查更新、获取用户信息等
   */
  onLaunch: function() {
    // 小程序启动时预加载图片
    this.preloadImages().then(() => {
      console.log('所有图片预加载完成');
    }).catch(err => {
      console.error('图片预加载过程中出错:', err);
    });
  }
});