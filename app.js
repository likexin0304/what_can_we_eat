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
    defaultImage: '/images/logo.png',
    imageOptimized: true, // 标记图片是否已经过优化处理
    imageLoadErrors: [] // 记录图片加载错误，用于调试
  },

  /**
   * 规范化图片路径
   * 修正可能错误的路径格式
   * @param {string} path - 图片路径
   * @returns {string} 规范化后的路径
   */
  normalizePath: function(path) {
    if (!path) return '';
    
    // 记录原始路径以便调试
    const originalPath = path;
    
    // 移除错误的前缀，如"/pages/index"
    if (path.includes('/pages/index/images/')) {
      path = path.replace('/pages/index', '');
      console.log(`路径修正: ${originalPath} -> ${path}`);
    }
    
    // 确保路径以/开头
    if (path && !path.startsWith('/')) {
      path = '/' + path;
      console.log(`路径添加前导斜杠: ${originalPath} -> ${path}`);
    }
    
    return path;
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
      // 规范化图片路径
      image: this.normalizePath(food.image),
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
   * 预加载所有食物图片
   * @return {Promise} 加载完成或失败的Promise
   */
  preloadImages: function() {
    const that = this;
    const imagePromises = [];
    
    // 遍历所有食物选项
    this.globalData.foodOptions.forEach((food, index) => {
      // 规范化图片路径
      const originalPath = food.image;
      const normalizedPath = this.normalizePath(originalPath);
      
      // 如果路径有变化，更新全局数据
      if (normalizedPath !== originalPath) {
        this.globalData.foodOptions[index].image = normalizedPath;
        console.log(`已修正图片路径: ${food.name} [${originalPath} -> ${normalizedPath}]`);
      }
      
      // 为每个图片创建加载Promise
      const imagePromise = new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: normalizedPath,
          success: (res) => {
            console.log(`图片 ${food.name} 加载成功: ${normalizedPath}`);
            resolve(res);
          },
          fail: (error) => {
            console.warn(`图片 ${food.name} 加载失败: ${normalizedPath}，尝试备用路径`);
            
            // 尝试备用路径
            const backupPath = this.tryBackupPath(normalizedPath);
            if (backupPath) {
              console.log(`尝试备用路径: ${backupPath}`);
              
              // 尝试加载备用路径
              wx.getImageInfo({
                src: backupPath,
                success: (backupRes) => {
                  console.log(`备用路径 ${backupPath} 加载成功`);
                  
                  // 更新全局数据中的图片路径
                  this.globalData.foodOptions[index].image = backupPath;
                  
                  resolve(backupRes);
                },
                fail: (backupError) => {
                  console.error(`备用路径 ${backupPath} 加载失败`);
                  
                  // 所有路径都失败，使用默认图片并记录错误
                  this.handleImageLoadError(normalizedPath, error);
                  
                  // 虽然实际加载失败，但返回成功以继续应用程序流程
                  resolve({ errMsg: "使用默认图片", path: this.globalData.defaultImage });
                }
              });
            } else {
              // 没有可用的备用路径，使用默认图片
              this.handleImageLoadError(normalizedPath, error);
              
              // 虽然实际加载失败，但返回成功以继续应用程序流程
              resolve({ errMsg: "使用默认图片", path: this.globalData.defaultImage });
            }
          }
        });
      });
      
      imagePromises.push(imagePromise);
    });
    
    // 等待所有图片加载完成
    return Promise.all(imagePromises)
      .then(() => {
        this.checkImageStatus();
        return { success: true };
      })
      .catch((error) => {
        console.error('预加载图片过程中出现错误:', error);
        this.checkImageStatus();
        return { success: false, error };
      });
  },
  
  /**
   * 尝试不同的备用路径形式
   * @param {string} originalPath - 原始图片路径
   * @return {string|null} 成功的备用路径或null
   */
  tryBackupPath: function(originalPath) {
    if (!originalPath) return null;
    
    // 构建可能的备用路径
    const possiblePaths = [
      originalPath,
      // 如果原路径不以/开头，添加/
      originalPath.startsWith('/') ? originalPath : '/' + originalPath,
      // 移除pages/index前缀
      originalPath.replace('/pages/index', ''),
      // 移除错误的双重图片路径
      originalPath.replace('/images/images/', '/images/'),
      // 检查是否需要添加images
      originalPath.includes('/images/') ? originalPath : '/images/' + originalPath.replace(/^\//, '')
    ];
    
    // 返回不同于原始路径的第一个备用路径
    for (const path of possiblePaths) {
      if (path !== originalPath) {
        return path;
      }
    }
    
    // 如果没有合适的备用路径，返回null
    return null;
  },
  
  /**
   * 处理图片加载错误
   * @param {string} imagePath - 失败的图片路径
   * @param {Error} error - 错误对象
   */
  handleImageLoadError: function(imagePath, error) {
    console.error(`图片加载失败 [${imagePath}]:`, error);
    
    // 记录错误信息
    const errorInfo = {
      originalPath: imagePath,
      error: error.message || '未知错误',
      time: new Date().toISOString()
    };
    
    // 如果此路径的错误尚未记录，则添加到错误日志
    if (!this.globalData.imageLoadErrors.some(err => err.originalPath === imagePath)) {
      this.globalData.imageLoadErrors.push(errorInfo);
    }
    
    // 找到对应的食物选项并更新为默认图片
    const foodIndex = this.globalData.foodOptions.findIndex(
      food => food.image === imagePath
    );
    
    if (foodIndex >= 0) {
      this.globalData.foodOptions[foodIndex].image = this.globalData.defaultImage;
      console.log(`已将 ${this.globalData.foodOptions[foodIndex].name} 的图片更新为默认图片`);
    }
  },

  /**
   * 检查图片加载状态
   * 返回图片加载报告
   */
  checkImageStatus: function() {
    const totalImages = this.globalData.foodOptions.length;
    const errorCount = this.globalData.imageLoadErrors.length;
    
    return {
      totalImages,
      errorCount,
      successCount: totalImages - errorCount,
      errors: this.globalData.imageLoadErrors,
      optimized: this.globalData.imageOptimized
    };
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
      // 检查并输出图片加载状态
      const status = this.checkImageStatus();
      console.log(`图片加载状态: 总计 ${status.totalImages}, 成功 ${status.successCount}, 失败 ${status.errorCount}`);
      
      if (status.errorCount > 0) {
        console.warn('部分图片加载失败，已使用默认图片替代');
      }
    }).catch(err => {
      console.error('图片预加载过程中出错:', err);
    });
  }
});