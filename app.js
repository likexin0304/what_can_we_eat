/**
 * 今天吃什么？小程序
 * 全局应用程序实例
 */
App({
  /**
   * 全局数据
   * foodHistory: 用户随机食物的历史记录
   * foodOptions: 可供随机选择的食物选项列表
   */
  globalData: {
    foodHistory: [],
    foodOptions: [
      { name: '海底捞', image: '/images/haidilao.png' },
      { name: '很久以前羊肉串', image: '/images/henjiuyiqian.png' },
      { name: 'KFC', image: '/images/kfc.png' },
      { name: '麦当劳', image: '/images/mcdonald.png' },
      { name: '今日牛事', image: '/images/jinriniushi.png' },
      { name: '烧烤', image: '/images/shaokao.png' }
    ]
  },

  /**
   * 添加食物到历史记录
   * @param {Object} food - 食物对象，包含名称和图片路径
   */
  addToHistory: function(food) {
    // 添加调试日志，记录传入的食物对象
    console.log('添加到历史记录的食物:', food);
    
    const history = this.globalData.foodHistory;
    // 添加时间戳
    const foodWithTimestamp = {
      ...food,
      timestamp: new Date().toLocaleString()
    };
    
    // 添加调试日志，记录添加时间戳后的食物对象
    console.log('添加时间戳后的食物:', foodWithTimestamp);
    
    // 将新记录添加到历史记录的开头
    history.unshift(foodWithTimestamp);
    
    // 添加调试日志，记录更新后的历史记录
    console.log('更新后的历史记录:', JSON.stringify(this.globalData.foodHistory));
    
    // 限制历史记录最多保存20条
    if (history.length > 20) {
      history.pop();
    }
  },

  onLaunch: function() {
    // 小程序启动时执行
  }
});